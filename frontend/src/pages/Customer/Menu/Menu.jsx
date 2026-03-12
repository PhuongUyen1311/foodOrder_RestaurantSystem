import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

import MenuContent from '../../../components/Customer/MenuContent/MenuContent';
import Cart from '../../../components/Customer/Cart/Cart';

import { getCategoryId, setDisplayToast } from '../../../actions/user';

function Menu() {

    const [categories, setCategories] = useState([]);
    const [tableNumber, setTableNumber] = useState(null);
    const [orderSource, setOrderSource] = useState('online');

    const accessToken = JSON.parse(sessionStorage.getItem("accessToken"));
    const dispatch = useDispatch();
    const isToast = useSelector(state => state.user.isToast);
    const location = useLocation();

    useEffect(() => {

        const params = new URLSearchParams(location.search);
        const table = params.get('table');

        const fetchCategory = async () => {
            const response = await fetch('/api/category/');
            const data = await response.json();

            const categoryActive = data.filter(item => item.is_active);
            if(categoryActive.length > 0){
                setCategories(categoryActive);
            }

            const categoryFirst = data.find(item => item.is_active);

            if(categoryFirst){
                dispatch(getCategoryId(categoryFirst.id));
            }
        };

        fetchCategory();

        if (table) {
            setTableNumber(table);
            setOrderSource('table');
            localStorage.setItem('tableNumber', table);
            localStorage.setItem('orderSource', 'table');
        } else {
            setOrderSource('online');
            localStorage.setItem('orderSource', 'online');
        }

    }, [location]);

    useEffect(() => {

        const savedOrderSource = localStorage.getItem('orderSource');
        const savedTableNumber = localStorage.getItem('tableNumber');

        if (savedOrderSource) {
            setOrderSource(savedOrderSource);

            if (savedOrderSource === 'table' && savedTableNumber) {
                setTableNumber(savedTableNumber);
            }
        }

    }, []);

    useEffect(() => {

        if (isToast) {
            toast.success('Sản phẩm đã được thêm vào giỏ hàng');
            dispatch(setDisplayToast(false));
        }

    }, [isToast]);

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />

            <Cart 
                accessToken={accessToken} 
                tableNumber={tableNumber}
                orderSource={orderSource}
            />

            <Container className='block-product'>

                {orderSource === 'table' && (
                    <div className="order-info">
                        <span>Bạn đang ngồi tại bàn số: {tableNumber}</span>
                    </div>
                )}

                <MenuContent
                    accessToken={accessToken}
                    categories={categories}
                />

            </Container>
        </>
    );
}

export default Menu;