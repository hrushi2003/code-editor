import React, { useEffect, useRef, useState } from 'react'
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import ClipLoader from 'react-spinners/ClipLoader';
import { toast, ToastContainer } from 'react-toastify';
import { Button, Splitter, Modal, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { EditOutlined } from '@ant-design/icons';
import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import ApplyCoalscing from './Services/Coalescing';
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
    // const [changesMap, setChangesMap] = useState(new Map());
    const patched = useRef([]);
    const didInit = useRef(false);
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
    const membersRef = useRef(null);
    const lastTypedRef = useRef(Date.now());
    const keyStrokes = useRef([]);
    const [leader, setLeader] = useState('');
    const [speed, setSpeed] = useState(0);
    const setIntervals = useRef(null);
    const [selectedBack, setSelectedBack] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const isRemote = useRef(false);
    const editorRef = useRef(null);
    const monacoE = useRef(null);



    const showLoading = () => {
        setShowModal(true);
        setModalLoading(true);

        setTimeout(() => {
            setModalLoading(false);
        }, 2000)
    }
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
        let res = await ApplyCoalscing(patched.current);
        console.log(res, "the res from coalscing");
        setSaved(true);
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
        setSaved(false);
    }
    useEffect(() => {
        getLan();
        socket.emit('authenticate', userId);
        console.log("Web socket connected", socket.connected);
        socket.on('connect',() => {
            console.log("socket connected");
        })
        socket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);
            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);
            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
        });
        socket.on("updateCursorAndData", async data => {
        if (data != null) {
            isRemote.current = true;
            // updateCursorPos(lineNo,columnNo);
            await setLine(data.changes);
            isRemote.current = false;
        }
    });
        return () => {
            socket.disconnect();
        }
    }, [userId]);
    useEffect(() => {
        languageRef.current = selectedLanguage;
        updateCode();
    }, [selectedLanguage]);
    useEffect(() => {
        var setIntervalTime = 7000;
        if (patched.current.length == 0) {
            if (setIntervals.current) clearInterval(setIntervals.current);
            setIntervals.current = setInterval(async () => {
                console.log(10000 + " ms is my current updation time");
            }, 10000);
            return;
        }
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
            else {
                if (setIntervals.current) clearInterval(setIntervals.current);
                setIntervals.current = setInterval(async () => {
                    console.log(10000 + " ms is my current updation time");
                }, 10000);
            }
        }, setIntervalTime);
        return () => {
            if (setIntervals.current) clearInterval(setIntervals.current);
        }
    }, [lastTypedRef.current])
    useEffect(() => {
        // socket.emit('cursorChange',cursorPos);
        cursorRef.current = cursorPos;
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

    // to show the corresponding user cursor with username on top in the editor
    var decorations = {};
    const showRemoteCursor = (editor, cursor) => {
        /*  const name = {
              username : "Hrushi"
          };
          decorations[cursor.userId] = editor.deltaDecorations(
              decorations[cursor.userId] || [],
              [
                  {
                      range: new monacoE.current.Range(
                          cursor.lineNumber, cursor.column,
                          cursor.lineNumber, cursor.column
                      ),
                      options: {
                          className : "border-l-2 border-red-500",
                            stickiness: monacoE.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                          afterContentClassName: `cursor-label-${name.username}`
                      }
                  },
              ]
          );
          if(!document.querySelector(`#cursor-label-${name.username}`)){
              const style = document.createElement("style");
              style.id = `cursor-label-${name.username}`;
              style.textContent = `
              .remote-cursor-label-${name.username}::after {
                  content: "${name.username}",
                  margin-left: 4px;
                  color: "red";
                  font-size: 12px;
                  font-weight: bold;
              }
              `;
              document.head.appendChild(style);*/
        const username = membersRef.current?.filter(x => x._id == cursor.userId)[0].username
        const className = `cursor-label-${username}`;

        // Add decoration
        decorations[cursor.userId] = editor.deltaDecorations(
            decorations[cursor.userId] || [],
            [
                {
                    range: new monacoE.current.Range(
                        cursor.lineNumber,
                        cursor.column,
                        cursor.lineNumber,
                        cursor.column
                    ),
                    options: {
                        className: "border-l-2 border-red-500",
                        stickiness:
                            monacoE.current.editor.TrackedRangeStickiness
                                .NeverGrowsWhenTypingAtEdges,
                        afterContentClassName: className,
                    },
                },
            ]
        );

        // Inject CSS dynamically (only once per user)
        if (!document.querySelector(`#style-${className}`)) {
            const style = document.createElement("style");
            style.id = `style-${className}`;
            style.textContent = `
                    .${className}::after {
                    content: "${username}";
                    margin-left: 6px;
                    color: red;
                    font-size: 12px;
                    font-weight: bold;
                    background: rgba(255,0,0,0.1);
                    border: 1px solid red;
                    border-radius: 3px;
                    padding: 3px 3px;
                }`;
            document.head.appendChild(style);
        }
        setTimeout(() => {
            decorations[cursor.userId] = editor.deltaDecorations(
                decorations[cursor.userId] || [],
                [
                    {
                        range: new monacoE.current.Range(
                            cursor.lineNumber, cursor.column,
                            cursor.lineNumber, cursor.column
                        ),
                        options: {
                            className: "border-l-2 border-red-500"
                        }
                    }
                ]
            );
        }, 3000);
    }
    const handleEditorMount = async (editor, monaco) => {
        try {
            editorRef.current = editor;
            monacoE.current = monaco;
            editor.focus();
            editor.onDidChangeCursorPosition((event) => {
                const { position } = event;
                const lineNumber = position.lineNumber;
                const column = position.column;
                setcursorPos({ lineNumber: lineNumber, column: column });
                const cursorData = {
                    lineNumber: lineNumber,
                    column: column,
                    userId: localStorage.getItem("userId")
                }
                showRemoteCursor(editor, cursorData);
            });
        }
        catch (err) {
            console.log(err);
        }
        editor.onKeyDown((event) => {
            /*  if (event.code === "Enter") {
                  console.log(editor.getPosition(), "the code is trying to get the pos");
                  const position = editor.getPosition();
                  const currentLine = position.lineNumber;
                  const model = editor.getModel();
                  const totalLines = model.getLineCount();
                  const mem = localStorage.getItem("userId") === members[0] ? members[1] : members[0];
     
                  // Track lines from the current line to the end
                  const linesFromCurrent = changesMap;
                  for (let i = currentLine; i <= totalLines; i++) {
                      linesFromCurrent.set(i, model.getLineContent(i));
                      socket.emit("changeData", { line: model.getLineContent(i), position: { lineNumber: i, column: 1 }, member: mem });
                  }
                  setChangesMap(linesFromCurrent);
                  // onCursorChangeUpdate(lineNumber,column);
              }*/
            if (event.keyCode == 1) {
                const selection = editor.getSelection();
                const model = editor.getModel();
                if (selection && selection.startLineNumber !== selection.endLineNumber) {
                    console.log('User selected multiple lines and pressed Backspace!', selection.startLineNumber, selection.endLineNumber, selection);
                    setSelectedBack(true);
                    if (selection.positionLineNumber > selection.selectionStartLineNumber) {
                        patched.current.push({
                            startIndx: selection
                                .selectionStartLineNumber - 1,
                            deleteCount: 1,
                            startColumn: selection
                                .selectionStartColumn - 1,
                            endColumn: model.getLineContent(selection.startLineNumber).length,
                            newLines: [''],
                            timeStamp: new Date().getTime()
                        });
                    }
                    else {
                        patched.current.push({
                            startIndx: selection
                                .selectionStartLineNumber - 1,
                            deleteCount: 1,
                            startColumn: 0,
                            endColumn: selection
                                .selectionStartColumn - 1,
                            newLines: [''],
                            timeStamp: new Date().getTime()
                        });
                    }
                    let startLine = Math.min(selection.selectionStartLineNumber, selection.positionLineNumber);
                    let endLine = Math.max(selection.selectionStartLineNumber, selection.positionLineNumber);
                    let count = endLine - startLine;

                    for (let i = 1; i < count; i++) {
                        let lineNumber = startLine + i;

                        // Ensure within valid range
                        if (lineNumber >= 1 && lineNumber <= model.getLineCount()) {
                            patched.current.push({
                                startIndx: startLine,  // backend expects 0-based
                                deleteCount: 1,
                                startColumn: 0,
                                endColumn: 9007199254740991,
                                newLines: [''],
                                timeStamp: new Date().getTime()
                            });
                        }
                    }

                    if (selection.positionLineNumber > selection.selectionStartLineNumber) {
                        patched.current.push({
                            startIndx: startLine,
                            deleteCount: 1,
                            startColumn: 0,
                            endColumn: selection
                                .endColumn - 1,
                            newLines: [''],
                            timeStamp: new Date().getTime()
                        });
                    }
                    else {
                        patched.current.push({
                            startIndx: selection
                                .positionLineNumber - 1,
                            deleteCount: 1,
                            startColumn: selection
                                .positionColumn - 1,
                            endColumn: 9007199254740991,
                            newLines: [''],
                            timeStamp: new Date().getTime()
                        });
                    }
                    setSelectedBack(false);
                }
            }
        });
        editor.onDidChangeModelContent((event) => {
            lastTypedRef.current = Date.now();
            getSpeed(lastTypedRef.current);
            if (!didInit.current) {
                didInit.current = true;
                return;
            }
            const selection = editor.getSelection();
            if (selectedBack && selection.startLineNumber != null || isRemote.current) {
                return;
            }
            const changes = event.changes;
            for (const change of changes) {
                const { range, text } = change;
                console.log(change, "change");
                const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
                const startIndx = startLineNumber - 1;
                const deleteCount = (endColumn - startColumn);
                const newLines = text.split("\n");
                console.log(newLines)
                patched.current.push({
                    startIndx,
                    deleteCount,
                    endIndx: endLineNumber - 1,
                    startColumn: startColumn - 1,
                    endColumn: (endColumn - 1),
                    newLines,
                    timeStamp: new Date().getTime(), // for consistent updates
                });
                const changeData = {
                    startColumn,
                    endColumn,
                    startLineNumber,
                    endLineNumber,
                    text,
                    timeStamp: new Date().getTime()
                }
                console.log(changeData, "ChangeData")
                SendChanges(changeData);
            }
        })
        const codeData = localStorage.getItem("codeId");
        if (codeData) {
            await backendCall.get("/getCode", {
                params: {
                    codeId: codeData
                }
            }).then((response) => {
                const ans = response.data.code.code.join('\n');
                setCode(ans);
                setLeader(response.data.code.leader);
                const lan = response.data.code.language ? response.data.code.language : "java";
                setSelectedLanguage(lan);
                const assignedMembers = response.data.code.users.map(mem => mem.userId);
                console.log(assignedMembers, "Are the assigned members");
                setMembers(assignedMembers);
                membersRef.current = assignedMembers;
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
    }
    const SendChanges = async (data) => {
        membersRef.current?.filter(x => x._id != userId).forEach(async (member, indx) => {
            console.log(member._id, "is the member changing the data and the data is ", data,socket.connected);
            socket.emit('changeData', {
                userId: member._id,
                changes: data
            });
        })
    }
    const updateCursorPos = (lineNo, columnNo) => {
        const model = editorRef.current;
        model.setPosition({ lineNumber: lineNo, column: columnNo });
    }
    const setLine = (changes) => {
        const model = editorRef.current;
        if (model == null) {
            console.log("model is null");
            return;
        }
        model.getModel().applyEdits([{
            range: new monacoE.current.Range(
                changes.startLineNumber,
                changes.startColumn,
                changes.endLineNumber,
                changes.endColumn
            ),
            text: changes.text,
            forceMoveMarkers: true
        }]);
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
    return (
        <div className='h-max my-2 w-max overflow-auto scrollbar-none flex flex-row'>
            <ToastContainer />
            <Splitter style={{
                height: 950,
                width: 1600,
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
                            options={{
                                quickSuggestions: true,
                                suggestOnTriggerCharacters: true,
                                wordBasedSuggestions: true,
                                snippetSuggestions: "inline",
                            }}
                        />
                    </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize="40%" minSize="10%" maxSize="90%">
                    <div className='flex mx-2 flex-col h-full'>
                        <div className='flex flex-row'>
                            <button onClick={runCode} className='mb-2 w-[100px] h-max p-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                {loading ? <ClipLoader className='mx-auto my-auto' color='blue' size={20} /> : "Run Code"}
                            </button>
                            <button className='mb-2 w-[200px] h-max p-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                {saved ? <ClipLoader className='mx-auto my-auto' color='blue' size={20} /> : "Saved succesfully"}
                            </button>
                            <button onClick={() => {
                                localStorage.clear();
                                navigate('/');
                            }} className='mb-2 w-[100px] h-max p-2 font-bold opacity-75 text-blue-600 hover:text-white border rounded-md mx-3 bg-blue-200 hover:bg-green-400'>
                                Logout
                            </button>
                        </div>
                        <div className='bg-gray-800 p-2 flex-1 border rounded-md h-[93vh]'>
                            <p className={output.stdout ? "text-white font-bold ml-2 mt-2 flex flex-col" : "text-white font-bold opacity-50 ml-2 mt-2 flex flex-col"}>
                                {output ? output.stdout.split('\n').map((element, index) => {
                                    return (<span key={index}>{element + '\n'}</span>)
                                })
                                    : "Click the run button to test your code"}
                            </p>
                        </div>
                    </div>
                </Splitter.Panel>
            </Splitter>
            <div className='w-[310px] h-[950px] bg-gray-700 ml-1 rounded-md shadow-2xl'>
                <div className='p-4 text-white border-b-2 border-gray-900'>
                    <h1 className="text-2xl font-bold text-white">Team Activity</h1>
                </div>
                <div className='flex flex-col gap-2 items-center'>
                    {members?.map((value, indx) => {
                        return (
                            <div
                                className='text-white w-[100%] h-max rounded-md p-2 gap-2 bg-gray-500 flex flex-row items-center'
                                key={indx}>
                                <UserOutlined className='text-blue-400 bg-gray-200 p-1 rounded-full' />
                                <div className='font-sans gap-1'>
                                    {//value._id == localStorage.getItem("userId") ? value.username + " ( You )" : value.username
                                        <span className='text-gray-100 text-[14px]'> {value.username}
                                            <span className='text-sky-300 text-[12px] font-bold'>
                                                {value._id === userId && leader === userId ? (" ( You & Leader )") : value._id === userId ? " ( You )" : ""}
                                            </span>
                                        </span>
                                    }
                                    <div className='flex flex-row items-center gap-1'>
                                        <div className="w-2 h-2 bg-green-500 rounded-full border-2 border-gray-300"></div>
                                        <p className='font-bold text-[13px]'>Online</p>
                                    </div>
                                </div>
                                <EditOutlined onClick={showLoading} className='text-green-400 ml-1 cursor-pointer' />
                                <Modal
                                    title={<h1 className='font-bold'>EDIT USER OPTIONS</h1>}
                                    footer={
                                        <div className='flex flex-row items-center gap-2'>
                                            <Button type='primary' onClick={() => {

                                            }}
                                            >Save Changes</Button>
                                            <Button type='primary' onClick={() => {

                                            }}>
                                                Cancel
                                            </Button>
                                        </div>
                                    }
                                    loading={modalLoading}
                                    open={showModal}
                                    onCancel={() => setShowModal(false)}
                                >
                                    <p className='font-bold text-blue-400'>CHANGE USER PERMISSIONS ON CODE RIGHTS</p>
                                    <Select
                                        defaultValue="Read and Write"
                                        style={{ width: 200 }}
                                        options={[
                                            { value: 'Read and Write' },
                                            { value: "Read Only" }
                                        ]}
                                    >
                                    </Select>
                                </Modal>
                                <DeleteOutlined className='text-red-500 cursor-pointer' />
                            </div>
                        )
                    })
                    }
                </div>
            </div>
        </div>
    );
}

export default CodeEditor