import React, { useState } from 'react'
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import eye from "./eye.png";
import eyeClose from "./eyeClose.png";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import code from "./code.png";
import axios from 'axios';
const Login = () => {
    const backend = axios.create({
        baseURL: 'https://code-editor-1-0xyt.onrender.com',
        timeout : 6000,
        headers: {
            'Content-Type': 'application/json',
        }
    });
    const navigate = useNavigate();
    const [visibilty,setVisibility] = useState(false);
    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const changeVisibility = () => {
        setVisibility(!visibilty);
    }
    const handleLogin = async() => {
        if(username === "" || password === ""){
            toast.error("Please fill all the fields",{
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light"
            })
        }
        else{
            await backend.post('/login', {username,password}).then((response) => {
                    localStorage.setItem("token",response.data.token);
                    sessionStorage.setItem("userId",response.data.user_id);
                    localStorage.setItem("userId",response.data.user_id);
                    navigate('/Projects');
            }).catch((err) => {
                    console.log(err)
                    toast.error("error in login of the user",{
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light"
                    });
            })
        }
    }
  return (
    <div className=''>
       <ToastContainer/>
        <img
        className='mx-auto w-[200px] h-[120px] rounded-md flex mt-[120px] md:mt-[120px] shadow-lg shadow-blue-400'
         src = {code} alt='logo' />
         <div className='ml-[20px] md:ml-[520px] shadow-2xl mt-[40px] border border-lime-500 w-[300px] md:w-max h-max p-5 rounded-lg flex flex-col bg-white'>
         <h1 className='mb-2 font-bold text-[12px]'>ENTER YOUR USERNAME : </h1>
           <input
           className='mb-4 border border-slate-900 rounded-md p-2 w-[260px] md:w-[400px] h-[35px]'
           placeholder='Enter your username'
           onChange={
            (e) => {
                setUsername(e.target.value);
                }
           }
           type='text'
            />
        <h1 className='mb-2 font-bold text-[12px]'>ENTER YOUR PASSWORD : </h1>
        <div className='mx-auto flex flex-row border border-slate-900 rounded-md pl-2'>
            <input
           className='focus:outline-none focus:border-none rounded-md align-middle w-[220px] md:w-[360px] h-[35px]'
           placeholder='Enter your password'
           type= {visibilty ? "text" : "password"}
           onChange={
            (e) => {
                setPassword(e.target.value);
            }}
          />
          <button onClick={changeVisibility} className='w-[25px] ml-1 mx-auto my-auto h-[35px]'><img className='mx-auto align-middle w-[25px] pr-2' alt='eye' src= {visibilty ? eye : eyeClose}/></button>
          </div>
            <button
             className='mt-2 border rounded-md h-[35px] font-bold text-[15px]'
             onClick={handleLogin}
             >
            LOG IN
            </button>
            <p className='mt-3 mx-auto text-[13px] font-bold'>
                New to this app ? 
                <Link className='text-blue-600' to="/Register"> Register</Link>
            </p>
         </div>
    </div>
  )
}

export default Login