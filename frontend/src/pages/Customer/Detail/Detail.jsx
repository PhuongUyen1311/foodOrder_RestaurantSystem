import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setCartStore, setCartItems, setDisplayToast } from '../../../actions/user';
import Cart from '../../../components/Customer/Cart/Cart';
import ProductCard from '../../../components/Customer/Product-Card/ProductCard';
import { fetchAddProductToCart, fetchGetCart } from '../../../actions/cart';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; import './detail.scss';
import "swiper/css";
import "swiper/css/navigation";
//
function Detail(props) {
    const [productItem, setProductItem] = useState(null);
    const [categoryID, setCategoryID] = useState(null);
    const [productRelated, setProductRelated] = useState([]);
    const [inputValue, setInputValue] = useState(1);
    const dispatch = useDispatch();
    const isToast = useSelector(state => state.user.isToast);
    const [ingredients, setIngredients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [maxQuantity, setMaxQuantity] = useState(0);

    const fetchIngredientsByProduct = async (productId) => {
        try {
            const res = await fetch(`/api/productBom/product/${productId}`);
            const data = await res.json();
            setIngredients(data || []);

            if (data && data.length > 0) {
                let max = Infinity;

                data.forEach(item => {
                    const stock = item.ingredient_id?.qty;
                    if (stock === undefined) {
                        console.error("thiếu qty:", item);
                        return;
                    }

                    const need = item.quantity;
                    if (!need || need <= 0) {
                        console.error("need lỗi:", item);
                        return;
                    }

                    const possible = Math.floor(stock / need);
                    max = Math.min(max, possible);
                });

                const finalMax = max === Infinity ? 0 : max;
                setMaxQuantity(finalMax);
            }
            else {
                setMaxQuantity(0);
            }
        } catch (err) {
            console.error(err);
            setIngredients([]);
        }
    };

    useEffect(() => {
        if (productItem?._id) {
            fetchIngredientsByProduct(productItem._id);
        }
    }, [productItem]);

    useEffect(() => {
        if (inputValue > maxQuantity) {
            setInputValue(maxQuantity || 1);
        }
        console.log("maxQuantity state:", maxQuantity);
    }, [maxQuantity]);

    useEffect(() => {
        if (isToast) {
            toast.success("Đã thêm vào giỏ hàng", {
                position: "top-right",
                autoClose: 1000,
            });

            dispatch(setDisplayToast(false));
        }
    }, [isToast, dispatch]);


    const API_URL = import.meta.env.VITE_API_URL;
    const imageSrc = productItem?.image_url
        ? `${API_URL}${productItem.image_url}`
        : '/images/no-image.png';
    const inputRef = useRef();
    let { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));
    const accessToken = sessionStorage.getItem("accessToken");

    const fetchProductDetail = async () => {
        const response = await fetch(`/api/product/${id}`);
        const data = await response.json();

        // console.log("Product detail API:", data);

        if (data) {
            setProductItem(data);
            setCategoryID(data.category_id);
            return;
        }
    }


    const fetchProductRelated = async () => {
        const response = await fetch(`/api/product/category/${categoryID}`);
        const products = await response.json();

        if (products) setProductRelated(products);
        return;
    }

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchProductDetail();
            setInputValue(1);
        }
    }, [id]);

    useEffect(() => {
        if (categoryID) {
            fetchProductRelated();
        }
    }, [categoryID]);

    const addProductInCart = async (idProduct) => {
        // console.log("Product ID nhận được:", idProduct);
        // console.log("productItem:", productItem);

        if (maxQuantity === 0) {
            toast.error("Món đã hết nguyên liệu");
            return;
        }

        if (inputValue > maxQuantity) {
            toast.error(`Chỉ còn tối đa ${maxQuantity} món`);
            return;
        }

        if (user && accessToken) {
            if (!idProduct) {
                console.error("❌ idProduct bị undefined");
                return;
            }

            let itemProduct = [{ id: idProduct, qty: inputValue }];

            await fetchAddProductToCart(accessToken, itemProduct);

            const response = await fetchGetCart(accessToken);
            const data = await response.json();

            if (data && data.cart) {
                const cartAction = setCartStore(data.cart);
                const cartItemsAction = setCartItems(data.cartItems);
                dispatch(cartAction);
                dispatch(cartItemsAction);
                dispatch(setDisplayToast(true));
            } else {
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("user");
                navigate('/login');
            }

        } else {
            const orderSource = localStorage.getItem('orderSource');
            if (orderSource === 'table') {
                let guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
                const existingItemIndex = guestCart.findIndex(item => item.id === idProduct);

                if (existingItemIndex > -1) {
                    guestCart[existingItemIndex].qty += inputValue;
                    guestCart[existingItemIndex].total_price = guestCart[existingItemIndex].qty * productItem.price;
                } else {
                    guestCart.push({
                        id: idProduct,
                        product_id: idProduct,
                        product_name: productItem.name,
                        product_image: productItem.image_url || 'no-image.png',
                        price: productItem.price,
                        qty: inputValue,
                        total_price: productItem.price * inputValue
                    });
                }

                localStorage.setItem('guestCart', JSON.stringify(guestCart));
                dispatch(setCartItems(guestCart));
                dispatch(setCartStore({
                    id: 'guest',
                    total_item: guestCart.reduce((sum, i) => sum + i.qty, 0),
                    total_price: guestCart.reduce((sum, i) => sum + i.total_price, 0)
                }));
                dispatch(setDisplayToast(true));
            } else {
                navigate('/login');
            }
        }
    }



    const onChangeHandler = event => {
        let value = +event.target.value;

        if (value > maxQuantity) value = maxQuantity;
        if (value < 1) value = 1;

        setInputValue(value);
    };

    const handlePlusProduct = () => {
        if (inputValue < maxQuantity) {
            setInputValue(inputValue + 1);
        }
    }

    const handleMinusProduct = () => {
        if (inputValue > 1) {
            setInputValue(inputValue - 1);
        }
    }

    return (
        <>
            <Cart accessToken={accessToken} />
            <div className=''>
                <div className='product-details container'>
                    <div className='product-details__nav'>
                        <button className='product-details__back' onClick={() => navigate('/')}>
                            {/* ← Trang chủ  */}
                        </button>
                    </div>
                    <div className='product-details__head'>
                        <div className='product-details__images'>
                            <div className='product-details__images-main'>
                                <img src={imageSrc} alt={productItem?.name || 'product image'}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/no-image.png';
                                    }} />
                            </div>
                        </div>
                        <div className='product-details__options'>
                            <div className='product-details__options__name'>
                                {productItem && productItem.name}
                            </div>
                            <div className='product-details__desc'>
                                <div className='product-details__desc__text'>
                                    {productItem && productItem.detail}
                                </div>
                            </div>
                            <div className='product-details__options__price'>
                                {productItem && productItem.price.toLocaleString('vi', { style: 'currency', currency: 'VND' })}
                            </div>
                            <div style={{ marginTop: "10px" }}>
                                {maxQuantity > 0 ? (
                                    <p style={{ color: "green" }}>
                                        Có thể đặt tối đa: {maxQuantity} món
                                    </p>
                                ) : (
                                    <p style={{ color: "red" }}>
                                        Món ăn đã hết nguyên liệu
                                    </p>
                                )}
                            </div>
                            <button
                                className="btn-view-ingredients"
                                onClick={() => {
                                    setShowModal(true);
                                }}
                            >
                                Xem thành phần
                            </button>
                            <hr />
                            <div className='product-details__options__group'>
                                <div className='product-details__options__group-quantity'>
                                    <button className='minus' type='button' onClick={() => handleMinusProduct()}>
                                        <svg width="10" height="3" viewBox="0 0 10 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.1904 0.393311H0.169434V2.51996H9.1904V0.393311Z" fill="#1AC073" />
                                        </svg>
                                    </button>
                                    {/* <input ref={inputRef} id='quantity' type='number' value={inputValue} name='quantity' onChange={onChangeHandler} /> */}
                                    <input
                                        disabled={maxQuantity === 0}
                                        ref={inputRef}
                                        type='number'
                                        value={inputValue}
                                        min={1}
                                        max={maxQuantity}
                                        onChange={onChangeHandler}
                                    />
                                    <button className='add' type='button' onClick={() => handlePlusProduct()}>
                                        <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.63367 3.39331H0.612793V5.51996H9.63367V3.39331Z" fill="#1AC073" />
                                            <path d="M6.25098 8.70996L6.25098 0.203308L3.99573 0.203308L3.99573 8.70996H6.25098Z" fill="#1AC073" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    className='product-details__submit'
                                    disabled={maxQuantity === 0}
                                    onClick={() => addProductInCart(productItem._id)}
                                >
                                    Add To Cart
                                </button>
                            </div>
                            <hr />
                        </div>
                    </div>
                    <div className='product-details__related'>
                        <div className='product-details__related__title'>Sản phẩm liên quan</div>
                        <div className='product-details__related__list'>
                            <Row>
                                {productRelated.length > 0 && productRelated.map((product, index) => {
                                    return <ProductCard key={index} items={product} />
                                })}
                            </Row>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h4>Thành phần sản phẩm</h4>

                        {ingredients.length > 0 ? (
                            <table className="modal-table">
                                <thead>
                                    <tr>
                                        <th>Tên</th>
                                        <th>Số lượng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingredients.map((ing) => (
                                        <tr key={ing._id}>
                                            <td>{ing.ingredient_id?.name}</td>
                                            <td>{ing.quantity} {ing.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Không có thành phần</p>
                        )}

                        <div className="modal-actions">
                            <button onClick={() => setShowModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Detail;