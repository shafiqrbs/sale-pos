import React from 'react';
import { Drawer } from '@mantine/core';

export default function GlobalDrawer({ 
    opened, 
    onClose, 
    children, 
    position = 'right',
    padding = 'lg',
    size = 'md',
    overlayProps = {
        backgroundOpacity: 0.55,
    },
    title,
    styles,
    ...restProps 
}) {
    return (
        <Drawer
            position={position}
            opened={opened}
            onClose={onClose}
            padding={padding}
            size={size}
            overlayProps={overlayProps}
            title={title}
            styles={styles}
            {...restProps}
        >
            {children}
        </Drawer>
    );
}
