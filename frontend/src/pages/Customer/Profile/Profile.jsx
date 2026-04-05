import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FaUser } from "react-icons/fa";
import Cart from '../../../components/Customer/Cart/Cart';
import './profile.scss';

function Profile(props) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [userUpdate, setUserUpdate] = useState(user || null);
    const [selectedImage, setSelectedImage] = useState(null);
    const accessToken = sessionStorage.getItem("accessToken");

    const fetchUpdateInfoUser = async (event) =>{
        event.preventDefault();

        const formData = new FormData();
        formData.append("first_name", userUpdate.first_name);
        formData.append("last_name", userUpdate.last_name);
        if (selectedImage) formData.append("avatar", selectedImage);
        formData.append("phone", userUpdate.phone);
        formData.append("gender", userUpdate.gender);
        formData.append("age", userUpdate.age);

        try {
            const response = await fetch("/api/customer",{
                method: 'post',
                body: formData,
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const data = await response.json();

            if(response.ok && data) {
                // If the user's password field is empty in data, but the backend doesn't return it when we send normal form, 
                // wait, the backend does `res.json(result)`, result has everything.
                setUserUpdate(data);
                sessionStorage.setItem("user", JSON.stringify(data));
                toast.success('Thông tin đã được cập nhật thành công!');
                
                // Reload immediately to update the header's display name
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(data.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi kết nối tới máy chủ');
        }
    }

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        setSelectedImage(file);
    };

    return (
        <>
            <ToastContainer 
                position="top-right"
                autoClose={1000}
            /> 
            <Cart accessToken={accessToken}/>
            <div className='block-profile'>
                <Container>
                    <Row>
                        <Col xs={4}>
                            <div className="profile__image">
                                <div className="profile__image-group">
                                    {selectedImage || userUpdate.avatar ? (
                                    <img src={selectedImage ? URL.createObjectURL(selectedImage) : `http://localhost:5000/static/images/${userUpdate.avatar}`} alt="Selected" />
                                     ) : (
                                          <div className="avatar-default">
                                             <FaUser size={160} /> </div> )}
                                    <input  type="file" name='avartar' accept="image/*" 
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <div className="upload-image">
                                    Nhấn vào ảnh để tải ảnh
                                </div>
                            </div>
                        </Col>

                        <Col xs={8}>
                            <div className="profile__title">
                                <h2>Thông tin cá nhân</h2>
                            </div>
                            <div className="profile__info">
                                <form action="">
                                    <div className='form-group'>
                                        <div className='profile-form-input'>
                                            <input type="text" name='first_name'
                                                onChange={(event)=> setUserUpdate({...userUpdate, first_name: event.target.value})} 
                                                value={userUpdate && userUpdate.first_name} 
                                                placeholder='Nhập tên của bạn'
                                            />
                                        </div>

                                        <div className='profile-form-input'>
                                            <input type="text" name='last_name' 
                                                onChange={(event)=> setUserUpdate({...userUpdate, last_name: event.target.value})} 
                                                value={userUpdate && userUpdate.last_name} 
                                                placeholder='Nhập họ của bạn'
                                            />
                                        </div>
                                    </div>

                                    <div className='profile-form-input'>
                                        <input type="text" name='email' 
                                            onChange={(event)=> setUserUpdate({...userUpdate, email: event.target.value})} 
                                            value={userUpdate && userUpdate.email} 
                                            placeholder='Nhập email của bạn'
                                        />
                                    </div>

                                    {/* <div className='profile-form-input'>
                                        <input type="password" name='password' value={user.password} placeholder='Nhập mật khẩu của bạn'/>
                                    </div> */}

                                    <div className='profile-form-input'>
                                        <input type="number" name='age' 
                                            onChange={(event)=> setUserUpdate({...userUpdate, age: event.target.value})}  
                                            value={userUpdate && userUpdate.age} 
                                            placeholder='Nhập tuổi của bạn'
                                        />
                                    </div>

                                    <div className='form-group'>
                                        <div className='profile-form-input'>
                                            <input type="text" name='phone' 
                                                onChange={(event)=> setUserUpdate({...userUpdate, phone: event.target.value})}  
                                                value={userUpdate && userUpdate.phone} 
                                                placeholder='Nhập số điện thoại'
                                            />
                                        </div>

                                        <select
                                            onChange={(event)=> setUserUpdate({...userUpdate, gender: event.target.value})}  
                                            name="gender" id="gender"
                                        >
                                            <option>Giới tính</option>
                                            <option selected={userUpdate.gender === 'male'} value="male">Nam</option>
                                            <option selected={userUpdate.gender === 'female'} value="female">Nữ</option>
                                        </select>
                                    </div>

                                    <div className='profile-form-btn'>
                                        <input type="submit" onClick={(event)=>fetchUpdateInfoUser(event)} className='btn btn-profile' value="Cập nhập"/>
                                    </div>
                                </form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

export default Profile;