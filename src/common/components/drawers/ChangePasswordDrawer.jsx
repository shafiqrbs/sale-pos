import { useNavigate, } from "react-router";
import {
    Button,
    Box,
    ScrollArea,
    Text,
    ActionIcon,
    Stack,
    Group,
    Flex,
    Divider,
} from "@mantine/core";
import GlobalDrawer from "./GlobalDrawer";
import { useTranslation } from 'react-i18next';
import {
    IconCheck,
    IconDeviceFloppy,
    IconRefreshDot,
    IconX,
} from "@tabler/icons-react";
import PasswordInputForm from "@components/form-builders/PasswordInputForm";
import { isNotEmpty, useForm } from "@mantine/form";
import { APP_NAVLINKS } from "@/routes/routes";
import { useChangePasswordMutation } from "@services/core";
import { showNotification } from "@components/ShowNotificationComponent";
import { rem } from "@mantine/core";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

export default function ChangePasswordDrawer({ opened, onClose }) {
    const { mainAreaHeight } = useMainAreaHeight();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [ changePassword, { isLoading } ] = useChangePasswordMutation();

    const form = useForm({
        initialValues: {
            current_password: "",
            new_password: "",
            confirm_password: "",
        },
        validate: {
            current_password: isNotEmpty("Current Password is required"),
            new_password: (value) => {
                if (!value) return t('NewPassword');
                if (value.length < 8) return t('PasswordValidateMessage');
                return null;
            },
            confirm_password: (value, values) => {
                if (!value) return t('ConfirmPassword');
                if (value !== values.new_password) return t('PasswordNotMatch');
                return null;
            },

        },
    });

    const handleResetPassword = async (values) => {
        const res = await changePassword(values);

        if (res.error) {
            const errorData = res.error.data;
            if (errorData) {
                if (typeof errorData.message === 'string') {
                    form.setErrors({ current_password: errorData.message });
                    return;
                }

                const errorObject = {};
                const isFieldErrors = Object.values(errorData).every(
                    (value) => Array.isArray(value) && value.length > 0
                );
                if (isFieldErrors) {
                    Object.keys(errorData).forEach((key) => {
                        errorObject[ key ] = errorData[ key ][ 0 ];
                    });
                    form.setErrors(errorObject);
                }
            }
        } else {
            showNotification(t('PasswordChangeSuccessfully'), 'teal', '', <IconCheck style={{ width: rem(18), height: rem(18) }} />);

            setTimeout(() => {
                logout()
            }, 1000)
        }
    };

    const closeModel = () => {
        onClose();
    };

    async function logout() {
        await window.dbAPI.destroyTableData();
        navigate(APP_NAVLINKS.LOGIN, { replace: true });
    }

    return (
        <GlobalDrawer
            opened={opened}
            position="right"
            onClose={closeModel}
            size="30%"
            title={t("ResetPassword")}
        >
            <Divider />
            <Box mt="sm" component="form" onSubmit={form.onSubmit(handleResetPassword)}>
                <Stack h="100%" justify="space-between" gap="md">
                    <Box bg='white' className='borderRadiusAll' >
                        <Box className='borderRadiusAll'>
                            <ScrollArea h={mainAreaHeight - 50} scrollbarSize={2} scrollbars="y" type="never">
                                <Box>
                                    <PasswordInputForm
                                        tooltip={form.errors.current_password ? form.errors.current_password : t('RequiredPassword')}
                                        form={form}
                                        name="current_password"
                                        label={t("CurrentPassword")}
                                        placeholder={t("EnterCurrentPassword")}
                                        required
                                        nextField="new_password"
                                        {...form.getInputProps("current_password")}
                                    />
                                </Box>
                                <Box mt='md'>
                                    <PasswordInputForm
                                        tooltip={form.errors.new_password ? form.errors.new_password : t('RequiredPassword')}
                                        form={form}
                                        name="new_password"
                                        label={t("NewPassword")}
                                        placeholder={t("EnterNewPassword")}
                                        required
                                        nextField="confirm_password"
                                        {...form.getInputProps("new_password")}
                                    />
                                </Box>
                                <Box mt='md'>
                                    <PasswordInputForm
                                        tooltip={form.errors.confirm_password}
                                        form={form}
                                        name="confirm_password"
                                        label={t("ConfirmPassword")}
                                        placeholder={t("EnterConfirmNewPassword")}
                                        required
                                        {...form.getInputProps("confirm_password")}
                                    />
                                </Box>
                            </ScrollArea>
                        </Box>
                        <Box py='6px' mb='2' mt={4} className='boxBackground borderRadiusAll'>
                            <Group justify="space-between">
                                <Flex
                                    gap="md"
                                    justify="center"
                                    align="center"
                                    direction="row"
                                    wrap="wrap"
                                >
                                    <ActionIcon
                                        variant="transparent"
                                        size="sm"
                                        color="red.6"
                                        onClick={closeModel}
                                        ml='4'
                                    >
                                        <IconX style={{ width: '100%', height: '100%' }} stroke={1.5} />
                                    </ActionIcon>
                                </Flex>

                                <Group gap={8}>
                                    <Flex justify="flex-end" align="center" h="100%">
                                        <Button
                                            variant="transparent"
                                            size="xs"
                                            color="red.4"
                                            type="reset"
                                            id=""
                                            comboboxProps={{ withinPortal: false }}
                                            p={0}
                                            rightSection={
                                                <IconRefreshDot style={{ width: '100%', height: '60%' }} stroke={1.5} />}
                                            onClick={() => {
                                                form.reset()
                                            }}

                                        >
                                        </Button>
                                    </Flex>
                                    <Stack align="flex-start">
                                        <>
                                            {
                                                !isLoading &&
                                                <Button
                                                    size="xs"
                                                    className={'btnPrimaryBg'}
                                                    type="submit"
                                                    id='EntityProductFormSubmit'
                                                    leftSection={<IconDeviceFloppy size={16} />}
                                                >
                                                    <Flex direction='column' gap={0}>
                                                        <Text fz={14} fw={400}>
                                                            {t("ResetPassword")}
                                                        </Text>
                                                    </Flex>
                                                </Button>
                                            }
                                        </>
                                    </Stack>
                                </Group>
                            </Group>
                        </Box>
                    </Box>
                </Stack>
            </Box>
        </GlobalDrawer>
    );
}

