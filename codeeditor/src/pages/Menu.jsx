import React, { useState } from 'react'
import {DownOutlined,SettingOutlined} from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import { Color } from 'antd/es/color-picker';
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
