import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { FaSearch, FaUtensils } from 'react-icons/fa'; // Import icons

import './banner.scss';
import bannerImg from '../../../assets/img/banner.png';

function Banner(props) {
    const { isDisplay } = props;
    const [key, setKey] = useState('');
    const navigate = useNavigate();

    const handleSubmitSearch = (event) => {
        event.preventDefault();
        if (key === '') return;
        navigate(`/search?key=${key}`);
        setKey('');
    }

    if (isDisplay) {
        return (
            <div className='banner'>
                <Container>
                    <div className='banner__content'>
                        <h2 className='banner__content__title'>
                            Welcome to{' '}
                            <span className='highlight'>Vietnam Cuisine</span>
                        </h2>
                        <div className='banner__content__desc'>
                            Discover the authentic flavors of Vietnam with our curated selection of traditional dishes. From savory classics to regional specialties, we bring the best of Vietnamese cuisine right to your table.
                        </div>
                        <div className='banner__content__cta'>
                            <div className='banner__content__search-box'>
                                <form onSubmit={(event) => handleSubmitSearch(event)}>
                                    <div className='search-input-wrapper'>
                                        <FaSearch className='search-icon' />
                                        <input
                                            type='text'
                                            onChange={(event) => setKey(event.target.value)}
                                            value={key}
                                            name='key'
                                            placeholder='Search for favorite dishes...'
                                        />
                                    </div>
                                    <button className='banner__content__btn search-btn' type="submit">
                                        Search
                                    </button>
                                </form>
                            </div>
                            <div className='banner__content__features'>
                                <div className='feature-item'>
                                    <i className="fa-solid fa-bowl-food"></i>
                                    <span>Variety of dishes</span>
                                </div>
                                <div className='feature-item'>
                                    <i className="fas fa-shipping-fast"></i>
                                    <span>Fast delivery</span>
                                </div>
                                <div className='feature-item'>
                                    <i className="fas fa-shield-alt"></i>
                                    <span>Quality assurance</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='banner__image'>
                        <div className='image-wrapper'>
                            <img src={bannerImg} alt='TBayEAT Banner' title='TBayEAT - Đặt món ngon' />
                        </div>
                        <div className='banner__decoration'>
                            <div className='decoration-circle'></div>
                            <div className='decoration-dots'></div>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    return null;
}

export default Banner;