import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { MdAdd } from "react-icons/md";
import { FaCheck } from 'react-icons/fa';
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IoIosCloseCircle } from "react-icons/io";
import axios from 'axios';
const Projects = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const currUser = sessionStorage.getItem("userId");
    console.log(token);
    const [changeState,setChangeState] = useState(false);
    const [projects, setProjects] = useState([]);
    const [projectName,setProjectName] = useState('');
    const [members,setMembers] = useState([]);
    const [isActive,setIsActive] = useState(false);
    const apiCall = axios.create({
        baseURL: 'https://code-editor-1-0xyt.onrender.com',
        timeout : 6000,
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : `Bearer ${token}`
        }
    });
    useEffect(() => {
        console.log(members)
    },[members])
    useEffect(() => {
        const getProjects = async() => {
            if(!token){
                navigate('/login');
            }
            await apiCall.get('/getProjects').then((data) => {
                console.log(data.data);
                setProjects(data.data.projects);
            }).catch((err) => {
                console.log(err);
                toast.error('error in fetching details',{
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme : "light"
                });
            });
        }
        getProjects();
    },[]);
    useEffect(() => {
        const getMembers = async() => {
            if(!token){
                navigate('/login');
            }
            setMembers([]);
            await apiCall.get('/getMembers').then((response) => {
                console.log(response.data);
               const newMembers = response.data.members.map((member) => ({
                id: member._id,
                name: member.username,
                isSelected : false
                }));
                setMembers(newMembers);
            }).catch((err) => {
                console.log(err);
                toast.error('error in fetching details',{
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme : "light"  
                });
            });
        }
        getMembers();
        return () => {
            setMembers([]);
        }
    },[isActive]);
    const handleProject = () => {
        if(!token){
            navigate('/login');
        }
        setIsActive(true);
    }
    const submitProject = async() => {
        if(!token){
            navigate('/');
        }
        if(projectName === null || projectName === ""){
            toast.error('Please enter project name',{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme : "light"
            });
            return;
        }
        const projectMembers = members?.filter(mem => mem.isSelected == true).map(mem => mem.id);
       await apiCall.post('/createProject',{
        projectName : projectName,
        membersId : projectMembers,
        userId : token
        }).then((response) => {
            console.log(response);
            localStorage.setItem("codeId",response.data.code_id);
            navigate("/editor");
        }).catch((err) => {
            console.log(err);
            toast.error('error in creating project',{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick : true,
                pauseOnHover : true,
                draggable : true,
                progress : undefined,
                theme : "light"
            });
        })
    }
    const handleClick = () => {
        if(!token){
            navigate('/login');
        }

    }
  return (
    <div className='w-[100%] h-[100%] flex-col'>
        <ToastContainer />
        {isActive ? (
            <div className='transition ease-in-out delay-100 translate-y-1 w-[50%] my-auto absolute inset-0 h-[500px] rounded-md bg-opacity-60 z-20 flex flex-col mx-auto bg-white backdrop-blur-sm'>
                <div className='w-[93%] bg-green-300 mx-auto p-2 rounded-lg'>
                    <div className='cursor-pointer'> 
                    <IoIosCloseCircle className='transition ease-in-out rounded-full delay-150 hover:-translate-y-1 hover:scale-105 hover:shadow-xl' 
                    size={30}
                    onClick={() => {
                        setIsActive(false);
                    }}
                    />
                    </div>
                </div>
                <div className='w-[90%] mx-auto h-[200px] mt-5 bg-[#E3F2FD] rounded-lg'>
                    <div className='flex mx-auto h-[100%] w-[100%] items-center flex-col mt-4 overflow-x-scroll'>
                        {members?.map((member,indx) => {
                            return (
                             <div key={indx} className='mx-auto my-auto flex flex-row w-[90%]'>
                            <h1 key={indx} className='text-2xl my-auto font-bold text-[#0D47A1]'>{member.name}</h1>
                            {!member.isSelected ?
                            <FaCheck key={indx} onClick={() => {
                                setMembers(members.map((element,index) => {
                                    if(index === indx){
                                        return {...element,isSelected : true}
                                    }
                                    return element;
                                }
                                ));
                            }} 
                            className='transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105 hover:shadow-xl shadow-black cursor-pointer my-auto ml-4' color='green' size={20}/>
                            : 
                            <IoIosCloseCircle key = {indx} onClick={() => {
                                setMembers(members.map((element,index) => {
                                    if(index === indx){
                                        return {...element,isSelected : false}
                                    }
                                    return element;
                                }
                                ));
                        }} size={25} color='red' className='transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105 hover:shadow-xl shadow-black rounded-full cursor-pointer my-auto ml-4'/>
                            }
                        </div>
                            )
                        })}
                    </div>
                </div>
            <div className='flex mx-auto my-auto flex-col'>
         <div className='shadow-2xl mt-[40px] border border-lime-500 w-[300px] md:w-max h-max p-5 rounded-lg flex flex-col bg-white'>
         <h1 className='mb-2 font-bold text-[12px]'>ENTER YOUR PROJECT NAME : </h1>
           <input
           className='mb-4 border border-slate-900 rounded-md p-2 w-[400px] h-[35px]'
           placeholder='Enter your Project Name'
           type='text'
           onChange={(e) => {
            setProjectName(e.target.value);
           }}
            />
            <button
             className='mt-2 border rounded-md h-[35px] font-bold text-[15px]'
             onClick={submitProject}
             >
            CREATE PROJECT
            </button>
         </div>
        </div>
        </div>
        ) : ""}
        <div className='mt-[30px] z-0 w-[100%] h-[100%] flex relative justify-center items-center
        bg-[#f7f7f7]'>
            <h1 className='text-[30px] font-bold text-blue-600'>CODES OVERVIEW</h1>
            <div className='p-2 flex ml-[20px] w-max bg-blue-500 flex-col rounded-lg my-auto transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105  hover:shadow-xl'>
                <button className='text-white font-bold'
                onClick={() => {
                    localStorage.clear();
                    navigate('/');
                }}
                >LOGOUT</button>
            </div>
            
        </div>
        <div
        className='w-[800px] p-2 z-0 flex mx-auto mt-[100px] border-[4px] shadow-2xl shadow-blue-200 border-blue-200 rounded-lg h-[600px]'
        >
            <div className='flex z-0 w-[100%] h-[100%] overflow-y-scroll flex-col'>
            <div className='w-[100%] z-10 h-[80px] mt-3 mx-auto rounded-lg border-[3px] cursor-pointer hover:bg-blue-100 active:bg-blue-400 border-green-100 flex flex-row'>
               <div className='mx-auto flex flex-row'>
                <div className='flex justify-center items-center flex-row'>
                    <h1 className='text-[20px] font-bold text-blue-600'>
                        CREATE NEW CODE
                    </h1>
                    <div className='ml-[4px] my-auto' 
                        onClick={handleProject}>
                        <MdAdd className='my-auto' size={30} color= "blue" />
                    </div>
                </div>
               </div>
            </div>
            {projects?.map((element,indx) => {
                return (
                    <div key={indx} onClick={() => {
                        localStorage.setItem("codeId",element._id);
                        navigate('/editor');
                    }} className='transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-105 w-[97%] z-10 h-[80px] mt-3 mx-auto rounded-lg border-[3px] cursor-pointer border-green-100 flex flex-row'>
               <div className='w-[45%] my-auto'><h1 className='text-[20px] font-bold my-auto ml-2'
               >{element.codeName}</h1></div>
                <div className='ml-2 my-auto text-black flex-row border rounded-lg bg-green-400 opacity-40 w-[53%] h-[75%]'>
                    <div className='ml-2 w-[100%] my-auto h-[100%] flex flex-row'>
                        {element.users?.map((ele,indx) => {
                            if(ele.userId._id != currUser){
                                return (
                                    <div key={indx} className='my-auto'><p className='text-[15px] font-bold'>{indx + 1}. {ele.userId.username}</p></div>
                                )
                            }
                            else{
                                return "";
                            }
                        })}
                    </div>
                </div>
            </div>
                )
            })}
            
            </div>   
        </div>
    </div>
  )
}

export default Projects