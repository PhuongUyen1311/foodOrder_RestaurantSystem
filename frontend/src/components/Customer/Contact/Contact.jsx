import React from 'react';

import contactImg from '../../../assets/img/contact.png';
import './contact.scss';

function Contact(props) {
    return (
        <div className='block-contact'>
            <div className="contact-form">
                <div className='contact-form-head'>
                    <h3>Have a question for us?</h3>
                    <span>Fill out this form and we will get back to you within 48 hours.</span>
                </div>

                <form method='post' action='/'>
                    <div className='contact-form-group'>
                        <input type="text" placeholder='Your name' name="name" />

                        <input type="text" placeholder='Your email' name="email" />
                    </div>
                    <div>
                        <textarea placeholder='Please enter your opinion' name="" id="" cols="30" rows="10"></textarea>
                    </div>

                    <div className='btn-contact'>
                        <input type="submit" value="Send" />
                    </div>
                </form>
            </div>
            <div className="contact-img">
                <img src={contactImg} alt="" />
            </div>
        </div>
    );
}

export default Contact;