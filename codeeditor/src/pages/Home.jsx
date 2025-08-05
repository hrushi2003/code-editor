import React from 'react'
import code from "./code.png"
import { useNavigate } from 'react-router-dom'
import {Button} from "antd";
const Home = () => {
    const navigate = useNavigate();
  return (
    <div className='w-[300px] md:w-[540px] p-4 mx-auto bg-blend-multiply mt-[140px] md:mt-[60px] shadow-xl rounded-xl h-max flex flex-col bg-white border border-green-300'>
        <img
        className='w-full mx-auto h-[50%] border rounded-2xl mb-4'
        src= {code} alt='logo'
         />
       <h1 className='mx-auto text-center font-bold mb-2 text-green-600'
       >We're delighted you're here with us! Let's make sure you find exactly what you're looking for.</h1>
       <Button
       type='primary'
       className='transition ease-in-out delay-150 hover:-translate-y-1 text-white hover:scale-105 border-[2px] h-[40px] shadow-xl font-bold rounded-md'
       onClick={() => navigate('/login')}
       >GET STARTED</Button>
    </div>
  )
}

export default Home;