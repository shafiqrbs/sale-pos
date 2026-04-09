import { Box, Text, Image, ActionIcon, Stack, SimpleGrid } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { IconX, IconPhoto, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
    useUploadProductGalleryImageMutation,
    useDeleteProductGalleryImageMutation,
} from "@services/product.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

const IMAGE_GATEWAY_URL = import.meta.env.VITE_IMAGE_GATEWAY_URL;

function GalleryDropzone({ productId, imageType, currentImagePath, label, height }) {
    const { t } = useTranslation();
    const [ uploadImage, { isLoading: isUploading } ] = useUploadProductGalleryImageMutation();
    const [ deleteImage, { isLoading: isDeleting } ] = useDeleteProductGalleryImageMutation();

    const imageUrl = currentImagePath
        ? `${IMAGE_GATEWAY_URL}/storage/${currentImagePath}`
        : null;

    const handleDrop = async (files) => {
        const formData = new FormData();
        formData.append("image", files[ 0 ]);
        formData.append("product_id", productId);
        formData.append("type", imageType);

        try {
            await uploadImage(formData).unwrap();
            showNotification(t("ImageUploadedSuccessfully"), "teal");
        } catch (error) {
            console.error(error);
            showNotification(t("ImageUploadFailed"), "red");
        }
    };

    const handleDelete = async (event) => {
        event.stopPropagation();
        const formData = new FormData();
        formData.append("product_id", productId);
        formData.append("type", imageType);

        try {
            await deleteImage(formData).unwrap();
            showNotification(t("ImageRemovedSuccessfully"), "teal");
        } catch (error) {
            console.error(error);
            showNotification(t("ImageRemoveFailed"), "red");
        }
    };

    if (imageUrl) {
        return (
            <Box
                pos="relative"
                h={height}
                style={{
                    border: "1px dashed var(--mantine-color-gray-3)",
                    borderRadius: 8,
                    overflow: "hidden",
                }}
            >
                <Image src={imageUrl} h={height} fit="cover" w="100%" />
                <ActionIcon
                    pos="absolute"
                    top={8}
                    right={8}
                    size="sm"
                    color="red"
                    variant="filled"
                    loading={isDeleting}
                    onClick={handleDelete}
                    style={{ zIndex: 1 }}
                >
                    <IconX size={14} />
                </ActionIcon>
            </Box>
        );
    }

    return (
        <Dropzone
            onDrop={handleDrop}
            accept={IMAGE_MIME_TYPE}
            maxSize={5 * 1024 * 1024}
            maxFiles={1}
            multiple={false}
            loading={isUploading}
            h={height}
            styles={{
                inner: {
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                },
            }}
        >
            <Stack align="center" gap={6} style={{ pointerEvents: "none" }}>
                <Dropzone.Accept>
                    <IconUpload size={28} color="var(--mantine-color-blue-6)" />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX size={28} color="var(--mantine-color-red-6)" />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    <IconPhoto size={28} color="var(--mantine-color-gray-5)" />
                </Dropzone.Idle>
                <Text size="sm" fw={500} c="dimmed">
                    {label}
                </Text>
            </Stack>
        </Dropzone>
    );
}

export default function ImageGallery({ product, productId }) {
    const { t } = useTranslation();
    const { mainAreaHeight } = useMainAreaHeight()

    const gallerySlots = [
        { type: "path_one", path: product?.path_one },
        { type: "path_two", path: product?.path_two },
        { type: "path_three", path: product?.path_three },
        { type: "path_four", path: product?.path_four },
    ];

    return (
        <Stack gap="md">
            <Box>
                <Text fw={600} mb="xs">
                    {t("FeatureImage")}
                </Text>
                <GalleryDropzone
                    productId={productId}
                    imageType="feature_image"
                    currentImagePath={product?.feature_image}
                    label={t("SelectFeatureImage")}
                    height={mainAreaHeight - 274}
                />
            </Box>

            <Box>
                <Text fw={600} mb="xs">
                    {t("GalleryImages")}
                </Text>
                <SimpleGrid cols={4} spacing="sm">
                    {gallerySlots.map((slot) => (
                        <GalleryDropzone
                            key={slot.type}
                            productId={productId}
                            imageType={slot.type}
                            currentImagePath={slot.path}
                            label={t("SelectImage")}
                            height={150}
                        />
                    ))}
                </SimpleGrid>
            </Box>
        </Stack>
    );
}
