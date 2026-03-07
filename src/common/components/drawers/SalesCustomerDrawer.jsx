import React, { useState } from 'react';
import { Stack, TextInput, Button, Divider, Group, Text, rem, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, generateSlug } from '@utils/index';
import { showNotification } from '@components/ShowNotificationComponent';
import GlobalDrawer from './GlobalDrawer';
import FormValidationWrapper from '@components/form-builders/FormValidationWrapper';
import { useOutletContext } from 'react-router';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';

export default function SalesCustomerDrawer({ opened, onClose, form }) {
    const { mainAreaHeight } = useOutletContext();
    const { t } = useTranslation();
    const [ isLoading, setIsLoading ] = useState(false);

    const customerForm = useForm({
        initialValues: {
            name: '',
            mobile: '',
            address: '',
            email: '',
        },
        validate: {
            name: (value) => (!value || value.trim() === '' ? t('NameIsRequired') || 'Name is required' : null),
            mobile: (value) => {
                if (!value || value.trim() === '') {
                    return t('MobileIsRequired') || 'Mobile is required';
                }
                if (value.trim().length < 11) {
                    return t('MobileLengthMustBeAtLeast11') || 'Mobile length must be at least 11';
                }
                return null;
            },
        },
    });

    // =============== handle save new customer ================
    const handleSaveNewCustomer = async () => {
        const validation = customerForm.validate();
        if (!validation.hasErrors) {
            setIsLoading(true);
            try {
                const customerData = customerForm.values;

                const newCustomerRecord = {
                    name: customerData.name.trim(),
                    mobile: customerData.mobile.trim(),
                    address: customerData.address?.trim() || '',
                    email: customerData.email?.trim() || '',
                    code: Math.floor(Math.random() * 1000000),
                    customer_id: `CUS-${Date.now().toString().slice(1, 13)}`,
                    unique_id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
                    slug: generateSlug(customerData.name),
                    created_date: formatDate(new Date()),
                    created_at: formatDateTime(new Date()),
                    debit: 0,
                    credit: 0,
                    balance: 0,
                    is_new: 1,
                };

                await window.dbAPI.upsertIntoTable('core_customers', newCustomerRecord);

                const savedCustomers = await window.dbAPI.getDataFromTable('core_customers');
                const savedCustomer = savedCustomers.find(
                    (customer) => customer.unique_id === newCustomerRecord.unique_id
                );

                if (savedCustomer) {
                    form.setFieldValue('customer_id', savedCustomer.id?.toString());
                    showNotification(t('CustomerSavedSuccessfully') || 'Customer saved successfully', 'green', '', '', true, 1000, true);
                    onClose();
                }
            } catch (error) {
                console.error('Error saving customer:', error);
                showNotification(t('FailedToSaveCustomer') || 'Failed to save customer', 'red', '', '', true, 1000, true);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSave = () => {
        handleSaveNewCustomer();
    };

    return (
        <GlobalDrawer
            opened={opened}
            onClose={onClose}
            title={t('CreateCustomer')}
            styles={{
                title: { fontWeight: 600, fontSize: rem(20), color: '#626262' },
            }}
        >
            <Divider mb="xs" />

            <Stack gap="md" h={mainAreaHeight - 20} justify="space-between">
                <Box>
                    <Stack gap="sm">
                        <TextInput
                            label={t('CustomerName')}
                            placeholder={t('EnterCustomerName')}
                            required
                            size="sm"
                            {...customerForm.getInputProps('name')}
                        />

                        <FormValidationWrapper
                            errorMessage={customerForm.errors.mobile}
                            opened={!!customerForm.errors.mobile}
                            position="top-end"
                        >
                            <TextInput
                                label={t('Mobile')}
                                placeholder={t('EnterMobileNumber')}
                                required
                                size="sm"
                                {...customerForm.getInputProps('mobile')}
                            />
                        </FormValidationWrapper>

                        <TextInput
                            label={t('Address')}
                            placeholder={t('EnterAddress')}
                            size="sm"
                            {...customerForm.getInputProps('address')}
                        />

                        <TextInput
                            label={t('Email')}
                            placeholder={t('EnterEmail')}
                            type="email"
                            size="sm"
                            {...customerForm.getInputProps('email')}
                        />
                    </Stack>
                </Box>

                {/* =============== action buttons ================ */}
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose} size="sm" leftSection={<IconX size={16} />}>
                        {t('Cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        size="sm"
                        bg="var(--theme-primary-color-6)"
                        c="white"
                        leftSection={<IconDeviceFloppy size={16} />}
                        loading={isLoading}
                    >
                        {t('Save')}
                    </Button>
                </Group>
            </Stack>
        </GlobalDrawer>
    );
}
