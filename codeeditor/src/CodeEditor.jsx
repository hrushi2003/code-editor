import React, { useEffect, useRef, useState } from 'react'
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import ClipLoader from 'react-spinners/ClipLoader';
import { toast, ToastContainer } from 'react-toastify';
import { Button, Splitter, Upload, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
const socket = io('https://code-editor-1-0xyt.onrender.com', {
    auth: {
        serverOffset: 0
    },
    path: '/socket',
    transports: ['websocket', 'polling', 'flashsocket'],
    withCredentials: true,
    ackTimeout: 10000,
    retries: 3,
});
const CodeEditor = (props) => {
    socket.auth = { username: localStorage.getItem("userId") };
    const navigate = useNavigate();
    const [changesMap, setChangesMap] = useState(new Map());
    const patched = useRef([]);
    const didInit = useRef(false);
    const changesMapRef = useRef(changesMap);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem("token");
    const apiCall = axios.create({
        baseURL: "https://emkc.org/api/v2/piston",
        timeout: 6000,
        headers: {
            'Content-Type': "application/json",
        }
    });
    const backendCall = axios.create({
        baseURL: "https://code-editor-1-0xyt.onrender.com/Projects",
        timeout: 6000,
        headers: {
            'Content-Type': "application/json",
            'Authorization': `Bearer ${token}`
        }
    });
    const [value, setValue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState("");
    const [saved, setSaved] = useState(false);
    const [cursorPos, setcursorPos] = useState({ lineNumber: 1, column: 1 });
    const cursorRef = useRef(cursorPos);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const languageRef = useRef(selectedLanguage);
    const [languages, setLanguages] = useState([]);
    const [output, setOutput] = useState('');
    const [members, setMembers] = useState([]);
    const [isTyping, setTyping] = useState(false);
    const lastTypedRef = useRef(Date.now());
    const [intervalTime, setIntervalTime] = useState(4000);
    const keyStrokes = useRef([]);
    const [speed, setSpeed] = useState(0);
    const setIntervals = useRef(null);
    const [contentLoaded, setContentLoaded] = useState(false);
    const editorRef = useRef(null);
    const monacoE = useRef(null);

    const getLan = async () => {
        try {
            await getLanguages();
        }
        catch (err) {
            console.log(err);
        }
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
    const updateCode = async () => {
        console.log(patched.current)
        const codeData = localStorage.getItem("codeId");
        const currLan = languageRef.current;
        await backendCall.post('/update', {
            changedCodePos: patched.current,
            codeId: codeData,
            language: currLan
        }).then((data) => {
            console.log(data);
            patched.current = [];
        }).catch((err) => {
            console.log(err);
        });
    }
    useEffect(() => {
        getLan();
        socket.emit('authenticate', userId);
        console.log("Web socket connected");
        socket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);
            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);
            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
        });
        return () => {
            socket.disconnect();
        }
    }, [userId]);
    useEffect(() => {
        changesMapRef.current = changesMap;
    }, [changesMap]);
    useEffect(() => {
        languageRef.current = selectedLanguage;
    }, [selectedLanguage]);
    useEffect(() => {
        var setIntervalTime = 7000;
        if (speed > 5) {
            setIntervalTime = 2000;
        }
        else if (speed > 2) {
            setIntervalTime = 5000;
        }
        console.log('the speed is ' + speed)
        if (setIntervals.current) clearInterval(setIntervals.current);
        setIntervals.current = setInterval(async () => {
            console.log(setIntervalTime + " ms is my current updation time");
            if (patched.current.length > 0) {
                updateCode();
            }
        }, setIntervalTime);
        return () => {
            if (setIntervals.current) clearInterval(setIntervals.current);
        }
    }, [lastTypedRef.current])
    useEffect(() => {
        // socket.emit('cursorChange',cursorPos);
        cursorRef.current = cursorPos;
        console.log(cursorPos);
        getLineContent();
    }, [cursorPos]);

    // To get the speed of typed characters
    const getSpeed = (date) => {
        keyStrokes.current.push(date);
        keyStrokes.current = keyStrokes.current.filter((t) => date - t <= 5000);
        const typedChars = keyStrokes.current.length;
        const elapsedSec = (Math.max(1, date - keyStrokes.current[0])) / 1000;
        const speed = (typedChars / elapsedSec)
        setSpeed(speed);
    }
    const handleEditorMount = async (editor, monaco) => {
        try {
            editorRef.current = editor;
            monacoE.current = monaco;
            editor.focus();
            setContentLoaded(true);
            editor.onDidChangeCursorPosition((event) => {
                const { position } = event;
                const lineNumber = position.lineNumber;
                const column = position.column;
                setcursorPos({ lineNumber: lineNumber, column: column });
            });
        }
        catch (err) {
            console.log(err);
        }
        editor.onKeyDown((event) => {
            if (event.code === "Enter") {
                //const lineNumber = position.lineNumber;
                // const column = position.column;
                console.log(editor.getPosition(), "the code is trying to get the pos");
                const position = editor.getPosition();
                const currentLine = position.lineNumber;
                const model = editor.getModel();
                const totalLines = model.getLineCount();
                const mem = localStorage.getItem("userId") == members[0] ? members[1] : members[0];

                // Track lines from the current line to the end
                const linesFromCurrent = changesMap;
                for (let i = currentLine; i <= totalLines; i++) {
                    linesFromCurrent.set(i, model.getLineContent(i));
                    socket.emit("changeData", { line: model.getLineContent(i), position: { lineNumber: i, column: 1 }, member: mem });
                }
                setChangesMap(linesFromCurrent);
                // onCursorChangeUpdate(lineNumber,column);
            }
            console.log(event.keyCode)
            if (event.keyCode == 1) {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (selection && selection.startLineNumber !== selection.endLineNumber) {
                    console.log('User selected multiple lines and pressed Backspace!', selection.startLineNumber, selection.endLineNumber, selection);
                    if (selection.positionLineNumber > selection.startLineNumber) {
                        patched.current.push({
                            startIndx: selection.
                                        selectionStartLineNumber - 1,
                            deleteCount: 1,
                            startColumn: selection.startColumn - 1,
                            endColumn: model.getLineContent(selection.startLineNumber).length,
                            newLines: [''],
                            timeStamp: new Date.getTime()
                        });
                    }
                    else {
                        patched.current.push({
                            startIndx: selection.
                                selectionStartLineNumber,
                            deleteCount: 1,
                            startColumn: 0,
                            endColumn: selection.startColumn - 1,
                            newLines: [''],
                            timeStamp: new Date.getTime()
                        });
                    }
                    for (let i = selection.selectionStartLineNumber + 1; i < selection.endLineNumber; i++) {
                        patched.current.push({
                            startIndx: i - 1,
                            deleteCount: 1,
                            startColumn: 0,
                            endColumn: model.getLineContent(i).length,
                            newLines : [''],
                            timeStamp: new Date().getTime(), // for consistent updates
                        });
                    }
                    if (selection.positionLineNumber > selection.startLineNumber) {
                        patched.current.push({
                            startIndx: selection.positionLineNumber - 1,
                            deleteCount: 1,
                            startColumn: 0,
                            endColumn: selection.endColumn - 1,
                            newLines: [''],
                            timeStamp: new Date.getTime()
                        });
                    }
                    else {
                        patched.current.push({
                            startIndx: selection.positionLineNumber,
                            deleteCount: 1,
                            startColumn: selection.endColumn - 1,
                            endColumn: model.getLineContent(selection.endLineNumber).length,
                            newLines: [''],
                            timeStamp: new Date.getTime()
                        });
                    }
                }
            }
        });
        editor.onDidChangeModelContent((event) => {
            setTyping(true);
            lastTypedRef.current = Date.now();
            getSpeed(lastTypedRef.current);
            if (!didInit.current) {
                didInit.current = true;
                return;
            }
            const changes = event.changes;
            for (const change of changes) {
                const { range, text } = change;
                const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
                const startIndx = startLineNumber - 1;
                const deleteCount = endLineNumber - startLineNumber + 1;
                const newLines = text.split("\n");
                console.log(newLines)
                patched.current.push({
                    startIndx,
                    deleteCount,
                    endIndx : endLineNumber - 1,
                    startColumn: startColumn - 1,
                    endColumn: endColumn,
                    newLines,
                    timeStamp: new Date().getTime(), // for consistent updates
                });
            }
        })
        const codeData = localStorage.getItem("codeId");
        console.log(codeData);
        if (codeData) {
            await backendCall.get("/getCode", {
                params: {
                    codeId: codeData
                }
            }).then((response) => {
                const ans = response.data.code.code.join('\n');
                console.log(response.data.code)
                setCode(ans);
                const lan = response.data.code.language ? response.data.code.language : "java";
                setSelectedLanguage(lan);
                const assignedMembers = response.data.code.users.map(mem => mem.userId);
                setMembers(assignedMembers);
            }).catch((err) => {
                console.log(err);
                toast.error("erorr in retriving code", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light"
                })
            });
        }
    }
    const handleLanguageChange = (e) => {
        setSelectedLanguage(e.target.value);
        console.log(selectedLanguage);
    }
    const getLineContent = () => {
        const editor = editorRef.current;
        const line = editor?.getModel().getLineContent(cursorPos.lineNumber);
        console.log(members);
        const mem = localStorage.getItem("userId") == members[0] ? members[1] : members[0];
        socket.emit("changeData", { line: line, position: cursorPos, member: mem });
        let lineNo = cursorPos.lineNumber;
        const updatedChangesMap = new Map(changesMap);
        updatedChangesMap.set(lineNo, line);
        setChangesMap(updatedChangesMap);
        // console.log("in the getLine Content" + JSON.stringify(changesMap, null, 2));
    }
    const updateCursorPos = (lineNo, columnNo) => {
        const model = editorRef.current;
        model.setPosition({ lineNumber: lineNo, column: columnNo });
    }
    const formatCode = (e) => {
        const arr = e.split("\n");
        // const model = editorRef.current;
        // let x = model.getPosition().toString()[1];
        setValue([...arr]);
    }
    socket.on("updateCursorAndData", data => {
        if (data != null) {
            const lineNo = data.position.lineNumber ? data.position.lineNumber : 1;
            const columnNo = data.position.column ? data.position.column : 1;
            const content = data.line ? data.line : "";
            console.log(lineNo, columnNo, content, "iam executing");
            // updateCursorPos(lineNo,columnNo);
            setLine(lineNo, content);
        }
    })
    const setLine = (lineNumber, changedLine) => {
        // if(lineNumber > value.length) return;
        const model = editorRef.current;
        if (model == null) {
            console.log("model is null");
            return;
        }
        const lineCount = model.getModel().getLineCount();
        if (lineNumber > lineCount) {
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
        let lineNo = lineNumber;
        const updatedChangesMap = new Map(changesMap);
        updatedChangesMap.set(lineNo, changedLine);
        setChangesMap(updatedChangesMap);

    }
    const runCode = async () => {
        setLoading(true);
        const model = editorRef.current;
        const code = model.getValue();
        const lang = selectedLanguage.split('#');
        try {
            const response = await apiCall.post('/execute', {
                language: lang[0],
                version: lang[1],
                files: [
                    {
                        content: code
                    }
                ]
            });
            if (response.data.run.stderr !== "") {
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
            else {
                console.log(response.data.run);
                setOutput(response.data.run);
            }
        } catch (err) {
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
    const combine = () => {
        for (let i = 0; i < value.length; i++) {
            if (i !== value.code.length - 1) composed += value.code[i] + '\n';
            else {
                composed += value.code[i];
            }
        }
    }
    const getChangedLines = (changes) => {
        changes.changes.forEach((e) => {
            const start = e.range.startLineNumber;
            const end = e.range.endLineNumber;
            for (let lines = start; lines <= end; lines++) {
                console.log(lines);
            }
        });
    }
    /* editorRef.current.onDidChangeModelContent((e) => {
         getChangedLines(e);
     });*/

    return (
        <div className='h-max my-2 w-max overflow-scroll flex flex-row'>
            <ToastContainer />
            <Splitter style={{
                height: 950,
                width: 1500,
            }}>
                <Splitter.Panel position="left" defaultSize="60%" minSize="20%" maxSize="90%">
                    <div className='flex flex-col'>
                        <div className='flex mx-2 flex-row'>
                            <select value={selectedLanguage} onChange={handleLanguageChange} className='w-max h-[30px] bg-blue-200 font-bold text-blue-600 border-2 rounded-md' id="languages" name="languages">
                                {languages ? languages.map((lan, index) => {
                                    return (<option key={index} value={lan.language + '#' + lan.version} name={lan.language}>{lan.language} {lan.version}</option>)
                                }) : ""}
                            </select>
                            <Button icon={<UploadOutlined />} className='ml-4 bg-white border-2 rounded-md border-blue-400' type='file'
                                onChange={handleFileChange}>
                                Click to Upload
                            </Button>
                        </div>
                        <Editor
                            className='my-3 mx-2 border border-blue-400'
                            height="95vh"
                            width="100%"
                            theme='vs-dark'
                            defaultLanguage={selectedLanguage ? selectedLanguage : "java"}
                            language={selectedLanguage.split('#')[0]}
                            defaultValue=" // comment"
                            value={code}
                            onMount={handleEditorMount}
                            onChange={(e) => formatCode(e)}
                        />
                    </div>
                </Splitter.Panel>
                <Splitter.Panel>
                    <div className='flex mx-2 flex-col'>
                        <div className='flex flex-row'>
                            <button onClick={runCode} className='mb-2 w-[100px] h-[30px] pl-2 pr-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                {loading ? <ClipLoader className='mx-auto my-auto' color='blue' size={20} /> : "Run Code"}
                            </button>
                            <button className='mb-2 w-[200px] h-[30px] pl-2 pr-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                {saved ? <ClipLoader className='mx-auto my-auto' color='blue' size={20} /> : "Saved succesfully"}
                            </button>
                            <button onClick={() => {
                                localStorage.clear();
                                navigate('/');
                            }} className='mb-2 w-[100px] h-[30px] pl-2 pr-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                Logout
                            </button>
                        </div>
                        <div className='bg-gray-800 p-2 w-[600px] border rounded-md h-[93vh]'>
                            <p className={output.stdout ? "text-white font-bold ml-2 mt-2" : "text-white font-bold opacity-50 ml-2 mt-2"}>
                                {output ? output.stdout.split('\n').map((element, index) => {
                                    return (<span key={index}>{element + '\n'}</span>)
                                })
                                    : "Click the run button to test your code"}
                            </p>
                        </div>
                    </div>
                </Splitter.Panel>
            </Splitter>
        </div>
    );
}

export default CodeEditor