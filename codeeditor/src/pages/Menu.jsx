import React, { useState } from 'react'
import {DownOutlined,SettingOutlined} from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
export const Menu = () => {
    const navigate = useNavigate();
    const items = [
        {
            key: '/Profile',
            label : "My Account",
            disabled : false,
        },
        {
            key: '/Register',
            label: "Settings",
            icon: <SettingOutlined />,
            disabled: false,
        },
        {
            key: '/Projects',
            label : "Projects",
            disabled : false
        },
         {
            key: '/',
            label: (
                <div className='text-red-400'>
                    Logout
                </div>
            ),
            disabled : false,
        }
    ];
    const [user,setUser] = useState({
        name : "John Doe",
        email : "johndoe@gmail.com"
    })
    const handleClick = ({key}) => {
        console.log(key)
        navigate(key);
    }
  return (
    <div>
        <Dropdown menu={{items, onClick : handleClick}} trigger={['click']} >
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
            <Space className='cursor-pointer text-blue-400'>
                Menu
                <DownOutlined/>
            </Space>
            </a>
        </Dropdown>
    </div>
  )
}

  /*const changedMap = Array.from(changesMapRef.current,([key,value]) => ({lineNumber : key, line : value}));
            console.log(changedMap);
            try{
            if(changedMap.size != 0){
                const model = editorRef.current;
                const reCheckedData = model.getValue().split('\n');
                changedMap.map((indx,data) => {
                    const line = data.line;
                    const lineNumber = data.lineNumber;
                    const currLine = reCheckedData[lineNumber - 1];
                    if(line != currLine){
                        return currLine; 
                    }
                    return line;
                })
            }
            }
            catch(err){
                console.log(err);      
}*/
