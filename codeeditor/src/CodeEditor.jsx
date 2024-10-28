import React, { useEffect, useRef,useState } from 'react'
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import {io} from "socket.io-client";
import ClipLoader from 'react-spinners/ClipLoader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const socket = io('http://localhost:3000',{
    auth: {
      serverOffset: 0
    },
    path : '/socket',
    transports: ['websocket','polling', 'flashsocket'],
    withCredentials: true,
    ackTimeout: 10000,
    retries: 3,
});
const CodeEditor = (props) => {
    const apiCall = axios.create({
        baseURL : "https://emkc.org/api/v2/piston",
        timeout : 6000,
        headers : {
            'Content-Type' : "application/json"
        }
    });
    const [value,setValue] = useState([]);
    const [loading,setLoading] = useState(false);
    const [code,setCode] = useState("");
    const [cursorPos,setcursorPos] = useState({lineNumber : 1, column : 1});
    const [selectedLanguage,setSelectedLanguage] = useState('');
    const[languages,setLanguages] = useState([]);
    const [output,setOutput] = useState('');
    const editorRef = useRef(null);
    const monacoE = useRef(null);

    const getLan = async() => {
        try{
            await getLanguages();
        }
        catch(err){
            console.log(err);
        }
        //Object.keys(languages).map(key => console.log(key));
    }

    const getLanguages = async () => {
        await apiCall.get('/runtimes').then((response) => {
            setLanguages(response.data);
        }).catch((err) => {
            console.log(err);
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            setCode(reader.result);
        };
        reader.readAsText(file);
    }

    useEffect(() => {
        getLan();
    },[]);

    
    useEffect(() => {
        socket.emit('cursorChange',cursorPos);
        getLineContent();
    },[cursorPos]);

    const handleEditorMount = async(editor,monaco) => {
        editorRef.current = editor;
        monacoE.current = monaco;
        editor.focus();
        editor.onDidChangeCursorPosition((event) => {
            const {position} = event;
            const lineNumber = position.lineNumber;
            const column = position.column;
            setcursorPos({lineNumber : lineNumber, column: column});
            onCursorChangeUpdate();
        });
    }
    const onCursorChangeUpdate = () => {
        // some code
    }
    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
        console.log(selectedLanguage);
    }
    const getLineContent = () => {
        const editor = editorRef.current;
        const line = editor?.getModel().getLineContent(cursorPos.lineNumber);
        socket.emit("changeData",{line : line, position : cursorPos});
       // console.log(line);
    }
    const updateCursorPos = (lineNo,columnNo) => {
        const model = editorRef.current;
        model.setPosition({lineNumber: lineNo,column : columnNo});
    }
    const formatCode = (e) => {
        const arr = e.split("\n");
       // const model = editorRef.current;
       // let x = model.getPosition().toString()[1];
        setValue([...arr]);
    }
    socket.on("updateCursorAndData",data => {
        if(data != null){
            const lineNo = data.position.lineNumber ? data.position.lineNumber : 1;
            const columnNo = data.position.column ? data.position.column : 1;
            const content = data.line ? data.line : "";
            console.log(lineNo,columnNo,content,"iam executing");
           // updateCursorPos(lineNo,columnNo);
            setLine(lineNo,content);
        }
    })
    const setLine = (lineNumber,changedLine) => {
       // if(lineNumber > value.length) return;
        const model = editorRef.current;
        if(model == null){
            console.log("model is null");
            return;
        }
        const lineCount = model.getModel().getLineCount();
        if(lineNumber > lineCount){
            const position = { lineNumber: lineNumber, column: 1 };
            model.getModel().applyEdits([
                {
                    range: new monacoE.current.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
                    text: '\n',
                    forceMoveMarkers: true,
                }
            ]);
            return;
        }
        console.log(model)
        const lineContent = model.getModel().getLineContent(lineNumber);
        model.getModel().applyEdits([{
            range: new monacoE.current.Range(lineNumber, 1, lineNumber, lineContent.length + 1),
            text: changedLine,
            forceMoveMarkers: true
        }]);
    }
    const runCode = async () => {
        setLoading(true);
        const model = editorRef.current;
        const code = model.getValue();
        const lang = selectedLanguage.split('#');
        try{
            const response = await apiCall.post('/execute',{
                language : lang[0],
                version : lang[1],
                files : [
                    {
                        content : code
                    }
                ]
            });
            if(response.data.run.stderr !== ""){
                toast.error('error occured!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light"
                    });
                console.log(response.data);
            }
            else{
                console.log(response.data.run);
                setOutput(response.data.run);
            }
        }catch(err){
            toast.error('error occured!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light"
            });
        }
        setLoading(false);
    }
    var composed = "";
    const combine = () =>{
        for(let i = 0; i < value.length; i++){
           if(i !== value.code.length - 1) composed += value.code[i] + '\n';
           else{
            composed += value.code[i];
           }
        }
    }
  return (
    <div className='h-max my-2 w-max overflow-scroll flex flex-row'>
        <ToastContainer />
        <div className='flex flex-col'>
        <div className='flex mx-2 flex-row'>
        <select value={selectedLanguage} onChange={handleLanguageChange} className='w-max h-[30px] bg-blue-200 font-bold text-blue-600 border-2 rounded-md' id="languages" name="languages">
            {languages ? languages.map((lan,index) => {
                return (<option key={index} value={lan.language +'#'+lan.version} name = {lan.language}>{lan.language} {lan.version}</option>)
            }) : ""}
        </select>
        <input className='ml-4 bg-white border-2 rounded-md border-blue-400' type='file'
        onChange={handleFileChange} />
        </div>
    <Editor
    className='my-3 mx-2 border border-blue-400'
    height = "95vh"
    width= "600px"
    theme='vs-dark'
    defaultLanguage = "javascript"
    language= {selectedLanguage.split('#')[0]}
    defaultValue = " // comment"
    value= {code}
    onMount = {handleEditorMount}
    onChange={(e) => formatCode(e)}
     />
     </div>
     <div className='flex mx-2 flex-col'>
        <button onClick={runCode} className='mb-2 w-[100px] h-[30px] pl-2 pr-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
          {loading ?  <ClipLoader className='mx-auto my-auto' color='blue' size={20}/> :"Run Code" }
        </button>
        <div className='bg-gray-800 p-2 w-[600px] border rounded-md h-[93vh]'>
            <p className= {output.stdout ? "text-white font-bold ml-2 mt-2" : "text-white font-bold opacity-50 ml-2 mt-2"}>
                {output ? output.stdout.split('\n').map((element,index) => {
                    return (<span key={index}>{element + '\n'}</span>)
                })
                : "Click the run button to test your code"}
            </p>
        </div>
     </div>
     </div>
  );
}

export default CodeEditor