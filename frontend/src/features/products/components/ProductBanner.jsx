import { Box } from '@mui/material';

export const ProductBanner = ({images}) => {
    if (!images || images.length === 0) return null;

  return (
    <Box sx={{overflow:"hidden", width:'100%', height:'100%', position:'relative' }}>
        <Box
            sx={{
                display: 'flex',
                transition: 'transform 0.5s ease-in-out',
                width: `${images.length * 100}%`,
                animation: `slideShow ${5 / images.length}s infinite alternate`,
            }}
        >
            {
            images.map((image, index) => (
                <Box key={index} sx={{width: `${100 / images.length}%`, flexShrink: 0}}>
                    <Box sx={{width:'100%',height:'100%', objectFit: "contain", aspectRatio: 1}} component="img" src={image} alt={'Banner Image'} />
                </Box>
            ))
            }
        </Box>
        <style>{`
            @keyframes slideShow {
                0% { transform: translateX(0); }
                100% { transform: translateX(-${((images.length - 1) / images.length) * 100}%); }
            }
        `}</style>
    </Box>
  )
}
