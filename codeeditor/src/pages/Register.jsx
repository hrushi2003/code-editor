import React, { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import code from "./code.png";
import { useNavigate } from 'react-router-dom';
import { Input,Button } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
const Register = () => {
    const backend = axios.create({
        baseURL: 'https://code-editor-1-0xyt.onrender.com',
        timeout : 6000,
        headers: {
            'Content-Type': 'application/json',
        }
    })
    const navigate = useNavigate();
    const [username,setUsername] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [confirm,setConfirmPass] = useState("");
    const [loading,setLoading] = useState(false);
    const containsSpecialChars =(str) => {
        const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        return specialChars.test(str);
      }
    const isValidUser = () => {
        return !containsSpecialChars(username);
    }
    const isValidEmail = () => {
        if(email === "") return true;
        return /@/.test(email);
    }
    const isValidPass = () => {
        if(containsSpecialChars(password) || password === ""){
            return true;
        }
        return false;
    }
    const isConfirmPass = () => {
        if(password === confirm || confirm == ""){
            return true;
        }
        return false;
    }
    const submitUser = async () => {
        setLoading(true);
        if(username === "" || email === "" || password === "" || confirm === ""){
            toast.error("Please fill out all the fields",{
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme : "light"
            })
        }else{
            if(password !== confirm || (password == confirm && !isValidPass)){
                toast.error("Passwords do not match",{
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme : "light"
                })
            }
            else{
                console.log("in true condition");
                await backend.post('/register',{
                    username,
                    email,
                    password
                }).then((response) => {
                    console.log(response);
                    if(response.status != 200){
                        toast.error(response.data.message,{
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
                    localStorage.setItem("token",response.data.token);
                    localStorage.setItem("userId",response.data.user_id);
                    navigate('/projects');
                }).catch((err) => {
                    toast.error(err,{
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme : "light"
                    });
                })
            }
        }
        setLoading(false);
    }
  return (
    <div className ='w-auto h-auto'>
          <ToastContainer />
        <img
        className='mx-auto w-[200px] h-[120px] rounded-md bg-chat-bg flex mt-[120px]'
         src = {code} alt='logo' />
        <div className='mx-auto shadow-2xl mt-[40px] border border-lime-500 w-[300px] md:w-max h-max p-5 rounded-lg flex flex-col bg-white'>
            <h1 className='mb-2 ml-1 font-bold text-[12px]'>ENTER YOUR USERNAME : </h1>
           <Input
           className='mb-3 border border-slate-900 rounded-md p-2 w-[260px] md:w-[400px] h-[35px]'
           name='username'
           placeholder='Enter your username'
           type='text'
           variant={username.length != 0 ?  "filled" : ""}
           onChange={(e) => {
            setUsername(e.target.value);
           }}
            />
            {isValidUser() === true ? ""
            : <span className='text-red-500 font-bold mb-2 text-[12px]'>username should not contain specialChars</span>
            }
             <h1 className='mb-2 font-bold text-[12px] ml-1'>ENTER YOUR EMAIL : </h1>
            <Input
           className='mb-3 border rounded-md p-2 w-[260px] md:w-[400px] h-[35px] border-slate-900'
           name='email'
           placeholder='Enter your email'
           type='email'
           variant= {email.length != 0 ?  "filled" : ""}
           onChange={(e) => {
            setEmail(e.target.value);
           }}
            />
            {isValidEmail() === true ? ""
            : <span className='text-red-500 font-bold mb-2 text-[12px]'>Enter valid email</span>
            }
             <h1 className='mb-2 font-bold text-[12px] ml-1'>ENTER YOUR PASSWORD : </h1>
            <Input
           className='mb-3 border rounded-md p-2 w-[260px] md:w-[400px] h-[35px] border-slate-900'
           name='password'
           placeholder='Enter your password'
           type='password'
           variant= {password.length != 0 ?  "filled" : ""}
           onChange={(e) => {
            setPassword(e.target.value);
           }}
            />
            {isValidPass() === true ? "" 
            : <span className='text-red-500 font-bold mb-2 text-[12px]'>Enter valid password</span>
            }
             <h1 className='mb-2 font-bold text-[12px] ml-1'>CONFIRM YOUR PASSWORD : </h1>
            <Input
           className='mb-3 border rounded-md p-2 w-[260px] md:w-[400px] h-[35px]  border-slate-900'
           name='confirmPass'
           placeholder='confirm your password'
           type='password'
           variant= {confirm.length != 0 ?  "filled" : ""}
           onChange={(e) => {
            setConfirmPass(e.target.value);
           }}
            />
            {isConfirmPass() === true ? "" 
            : <span className='text-red-500 font-bold mb-2 text-[12px]'>Password did not match</span>
            }
            <Button
             className='mt-2 border rounded-md h-[35px] font-bold text-[15px]'
             type='primary'
             loading = {
                loading
             }
             onClick={submitUser}>
            SUBMIT
            </Button>
            <p className='mt-3 mx-auto text-[13px] font-bold'>
                Already have an account? 
                <Link className='text-blue-600' to="/Login"> Login</Link>
            </p>
        </div>
    </div>
  )
}

export default Register