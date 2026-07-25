import { Box } from '@mui/material';

export const ProductBanner = ({images}) => {
    if (!images || images.length === 0) return null;

    return (
        <Box sx={{overflow:"hidden", width:'100%', height:'100%' }}>
            {images.map((image, index) => (
                <Box
                    key={index}
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: index === 0 ? 'block' : 'none',
                    }}
                >
                    <Box
                        component="img"
                        sx={{width:'100%',height:'100%',objectFit:"contain"}}
                        src={image}
                        alt={'Banner Image'}
                    />
                </Box>
            ))}
        </Box>
    );
};
