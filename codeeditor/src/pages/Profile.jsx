import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import  axios from 'axios';
import { Button, Input, Modal } from 'antd';
import { toast, ToastContainer } from 'react-toastify';

export const Profile = () => {
    const user = sessionStorage.getItem('userId');
    const [open,setOpen] = useState(false);
    const [loading,setLoading] = useState(false);
    const [profile, setProfile] = useState({
        username : {
            name : "Hrushikesh",
            isActive : false
        },
        email : {
            email : "hrushikesh@gmail.com",
            isActive : false
        },
        password : {
            password : "hrushikesh@123",
            isActive : false,
        }
    });
    const showModal = () => {
        setOpen(true)
    }
    const handleCancel = () => {
        setOpen(false);
    }
    const token = localStorage.getItem('token');
    const [currUser,setUser] = useState();
    const [oldPassword,setOldPassword] = useState("");  
    const [newPass,setNewPass] = useState();
    const navigate = useNavigate();
    const apiCall = axios.create({
        baseURL: 'https://code-editor-1-0xyt.onrender.com',
        timeout : 6000,
        headers: {
            'Content-Type': 'application/json',
            'Authorization' : `Bearer ${token}`
        }
    });
        const handleModal = async () => {
        setLoading(true);
        if(oldPassword != profile.password.password){
            toast.error("Old password is incorrect",{
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme : "light"
            });
            setLoading(false);
            return;
        }
        await apiCall.get('/updatePass',{
            userId : user,
            oldPassword : profile.password.password,
            newPassword : newPass

        }).then((data) => {
            toast.success("Password updated successfully",{
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme : "light"
            });
        }).catch((err) => {
            toast.error("Error updating password",{
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme : "light"
            });
        })
        setLoading(false);
        setOpen(false);
    }
    useEffect(() => {
        if(!token || token === ""){
            return () => {
                setProfile({});
                sessionStorage.clear();
                localStorage.clear();
                navigate('/');
            }
        }
    },[])
  return (
    <div className='w-[100%] h-[100%] flex flex-col justify-center items-center'>
        <ToastContainer />
        <div className='flex flex-col mt-5 mx-auto items-center justify-center h-[100%]'>
            <h1 className='text-[25px] font-bold text-blue-300'>PROFILE</h1>
        </div>
        <div className='w-[80%] h-[700px] flex flex-col gap-5 items-center border-2 mt-5 mx-auto p-5 rounded-lg'>
            <div className='w-[100%] flex flex-row gap-3 items-center mx-auto'>
                <h1 className='text-[20px] w-[30%] font-bold text-blue-300'>USERNAME : </h1>
                <div className='w-[70%] my-auto items-center text-gray-400'>
                    {!profile.username.isActive ?
                    <Input type='text' className='w-[100%] text-[16px] font-bold'
                    variant= {profile.username.name ? "filled" : "outlined"}
                    onChange={(e) => {
                        setProfile(prev => ({...prev, username: {name : e.target.value}}))
                    }}
                    onFocus={() => {
                        setProfile((prev) => {
                            prev.username.isActive = !prev.username.isActive;
                            return prev;
                        })
                    }}
                    value={profile.username.name?.toUpperCase()}
                    >
                    </Input>
                    : (
                    <Input type='text' className='w-[100%] text-[16px] font-bold text-black'
                    onBlur ={() => {
                        setProfile((prev) => {
                            prev.username.isActive = !prev.username.isActive;
                            return prev;
                        })
                    }}
                    onChange={(e) => {
                        setProfile(prev => ({...prev, username: {name: e.target.value}}))
                    }}
                    value={profile.username.name?.toUpperCase()}
                    >
                    </Input>  
                    )}
                </div>
            </div>
            <div className='w-[100%] flex flex-row gap-3 items-center mx-auto'>
                <h1 className='text-[20px] w-[30%] font-bold text-blue-300'>EMAIL : </h1>
                <div className='w-[70%] my-auto items-center text-gray-400'>
                    {!profile.username.isActive ?
                    <Input type='text' className='w-[100%] text-[16px] font-bold'
                    variant= {profile.email.email ? "filled" : "outlined"}
                    onChange={(e) => {
                        setProfile(prev => ({...prev, email: {email : e.target.value}}))
                    }}
                    onFocus={() => {
                        setProfile((prev) => {
                            prev.email.isActive = !prev.email.isActive;
                            return prev;
                        })
                    }}
                    value={profile.email.email?.toUpperCase()}
                    >
                    </Input>
                    : (
                    <Input type='text' className='w-[100%] text-[16px] font-bold text-black'
                    onBlur ={() => {
                        setProfile((prev) => {
                            prev.email.isActive = !prev.email.isActive;
                            return prev;
                        })
                    }}
                    onChange={(e) => {
                        setProfile(prev => ({...prev, email: {email: e.target.value}}))
                    }}
                    value={profile.email.email?.toUpperCase()}
                    >
                    </Input>  
                    )}
                </div>
            </div>
            <div className='w-[100%] flex flex-row gap-3 items-center mx-auto'>
                <h1 className='text-[20px] w-[30%] font-bold text-blue-300'>PASSWORD : </h1>
                <div className='w-[48%] my-auto items-center text-gray-400'>
                    <Input className='w-[100%] text-[16px] font-bold'
                    type = {profile.password.isActive ? "text" : "password"}
                    value={profile.password.password}
                    variant='filled'
                    readOnly
                    onFocus={() => {
                        setProfile((prev) => ({
                            ...prev,
                            password: { ...prev.password, isActive: !prev.password.isActive }
                        }))
                    }}
                    onBlur={() => {
                        setProfile((prev) => ({
                            ...prev,
                            password: { ...prev.password, isActive: !prev.password.isActive }
                        }))
                    }}
                    >
                    </Input>  
                </div>
                <div className='w-max items-center'>
                    <Button
                    onClick={showModal}
                    className='w-max p-2 font-bold'
                    type='primary'
                    >Change Password
                    </Button>
                    <Modal
                    title = "UPDATE PASSWORD"
                    open = {open}
                    onOk={handleModal}
                    confirmLoading = {loading}
                    onCancel={handleCancel}
                    className='flex flex-col gap-3'
                    >
                        <Input
                        className='w-[100%] text-[16px] font-bold'
                        type = "password"
                        placeholder='Enter Old Password'
                        onChange={(e) => {
                            setOldPassword(e.target.value);
                        }}
                        ></Input>
                        <Input
                        className='w-[100%] text-[16px] font-bold'
                        type = "password"
                        placeholder='Enter New Password'
                        onChange={(e) => {
                            setNewPass(e.target.value);
                        }}
                        ></Input>
                    </Modal>
                </div>
            </div>
            <div className='w-[100%] h-[60%] bg-blue-400 p-2 flex flex-col rounded-lg mt-5 items-center'>
                <h1 className='text-white text-[15px] font-bold mt-2'>YOUR PROJECTS</h1>
                <div className='bg-white w-[98%] flex flex-col items-center gap-2 h-[90%] overflow-auto hide-scrollbar rounded-lg mt-2 p-2'>
                    <div className='w-[100%] flex bg-green-50 p-2 h-[50px] rounded-lg items-center'>
                        <h1 className='text-[15px] flex font-bold text-blue-400 my-auto'>Project
                        1</h1>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
