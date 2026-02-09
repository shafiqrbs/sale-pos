import React from 'react';
import { Modal } from '@mantine/core';

export default function GlobalModal({
    opened,
    onClose,
    children,
    padding = 'lg',
    size = 'lg',
    overlayProps = {
        backgroundOpacity: 0.55,
    },
    title,
    styles,
    centered = true,
    ...restProps
}) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            padding={padding}
            size={size}
            overlayProps={overlayProps}
            title={title}
            styles={styles}
            centered={centered}
            h="100%"
            {...restProps}
        >
            {children}
        </Modal>
    );
}
