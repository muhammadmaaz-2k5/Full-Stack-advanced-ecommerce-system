import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';
import MobileStepper from '@mui/material/MobileStepper';
import { Box, useTheme } from '@mui/material';
import { useState } from 'react';

export const ProductBanner = ({images}) => {
    const theme=useTheme()

    const maxSteps = images.length;

  return (
    <>
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      style={{overflow:"hidden", width:'100%', height:'100%' }}
      slidesPerView={1}
    >
        {
        images.map((image,index) => (
        <SwiperSlide key={index}>
            <div style={{width:"100%",height:'100%'}}>
                <Box component="img" sx={{width:'100%',objectFit:"contain"}} src={image} alt={'Banner Image'} />
            </div>
        </SwiperSlide>
        ))
        }
    </Swiper>
    <div style={{alignSelf:'center'}}>
        <MobileStepper steps={maxSteps} position="static" />
    </div>
    </>
  )
}
