import React, { useState } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Modal from 'react-modal';

import demo1 from '../assets/demo/demo1.png';
import demo2 from '../assets/demo/demo2.png';
import demo3 from '../assets/demo/demo3.png';
import demo4 from '../assets/demo/demo4.png';

const DemoSlider: React.FC = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    const openModal = (image: string) => {
        setSelectedImage(image);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedImage(null);
    };

    return (
        <div className="demo-container">
            Runelogs is a combat log analysis website for Old School RuneScape.

            Runelogs allows you to see your damage done, damage taken, attack animations, boosted stats, gear swaps, and more tick by tick.

            By analyzing your fights you can pinpoints areas where you can improve your gameplay and make measurable improvements. RuneLogs can also be used to analyze hit distributions to better understand combat mechanics.

            Whats is Activity?
            Activity is a measurement of your time spent actively attacking. More specifically it is the sum of the ticks used by all of your attack animations divided by the number of ticks in the fight. Some fights, such as Pestilent Bloat, make it very hard to stay active at all times, but generally you should aim for as close to 100% Activity as possible.

            What are Boosted Hits?
            Boosted hits are simply hits where your stats are fully boosted for the attack animation. Partial boosts count as partial boosted hits. For example being boosted to 117/118 would count as 18/19 (~94.74%) of a boosted hit.
            <Slider {...settings}>
                <div onClick={() => openModal(demo1)}>
                    <img src={demo1} alt="Demo 1" />
                </div>
                <div onClick={() => openModal(demo2)}>
                    <img src={demo2} alt="Demo 2" />
                </div>
                <div onClick={() => openModal(demo3)}>
                    <img src={demo3} alt="Demo 3" />
                </div>
                <div onClick={() => openModal(demo4)}>
                    <img src={demo4} alt="Demo 4" />
                </div>
            </Slider>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'none',
                        border: 'none',
                        padding: '0',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    },
                }}
            >
                {selectedImage && <img src={selectedImage} alt="Full Screen" style={{ maxWidth: '100%', maxHeight: '100vh' }} />}
            </Modal>
        </div>
    );
};

export default DemoSlider;