import React, { useState, useEffect } from 'react';
import { Stack, Select, TextInput, Button, Divider, Group, Text, rem, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, generateSlug } from '@utils/index';
import { showNotification } from '@components/ShowNotificationComponent';
import GlobalDrawer from './GlobalDrawer';
import FormValidationWrapper from '@components/form-builders/FormValidationWrapper';
import { useOutletContext } from 'react-router';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';

export default function CustomerDrawer({ opened, onClose, form, customersDropdownData, onCustomerSelect }) {
    const { mainAreaHeight } = useOutletContext();
    const { t } = useTranslation();
    const [ selectedCustomerId, setSelectedCustomerId ] = useState(null);
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

    // =============== reset form when drawer closes and set initial customer when opened ================
    useEffect(() => {
        if (!opened) {
            setSelectedCustomerId(null);
            customerForm.reset();
        } else {
            if (form.values.customer_id) {
                setSelectedCustomerId(form.values.customer_id);
                const existingCustomer = customersDropdownData.find(
                    (customer) => customer.id?.toString() === form.values.customer_id?.toString()
                );
                if (existingCustomer && onCustomerSelect) {
                    onCustomerSelect({
                        id: existingCustomer.id,
                        name: existingCustomer.name,
                        mobile: existingCustomer.mobile,
                        email: existingCustomer.email || '',
                        address: existingCustomer.address || '',
                    });
                }
            }
        }
    }, [ opened ]);

    // =============== handle customer selection from dropdown ================
    const handleCustomerDropdownChange = (customerId) => {
        setSelectedCustomerId(customerId);
        if (customerId) {
            const selectedCustomer = customersDropdownData.find(
                (customer) => customer.id?.toString() === customerId?.toString()
            );
            if (selectedCustomer) {
                form.setFieldValue('customer_id', selectedCustomer.id?.toString());
                if (onCustomerSelect) {
                    onCustomerSelect({
                        id: selectedCustomer.id,
                        name: selectedCustomer.name,
                        mobile: selectedCustomer.mobile,
                        email: selectedCustomer.email || '',
                        address: selectedCustomer.address || '',
                    });
                }
            }
        } else {
            form.setFieldValue('customer_id', '');
            if (onCustomerSelect) {
                onCustomerSelect(null);
            }
        }
    };

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
                    if (onCustomerSelect) {
                        onCustomerSelect({
                            id: savedCustomer.id,
                            name: savedCustomer.name,
                            mobile: savedCustomer.mobile,
                            email: savedCustomer.email || '',
                            address: savedCustomer.address || '',
                        });
                    }
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
        if (selectedCustomerId) {
            onClose();
        } else {
            handleSaveNewCustomer();
        }
    };

    const dropdownOptions = customersDropdownData.map((customer) => ({
        label: `${customer.mobile || ''} -- ${customer.name || ''}`,
        value: customer.id?.toString(),
    }));

    return (
        <GlobalDrawer
            opened={opened}
            onClose={onClose}
            title={t('SelectCustomer')}
            styles={{
                title: { fontWeight: 600, fontSize: rem(20), color: '#626262' },
            }}
        >
            <Divider mb="md" />

            <Stack gap="md" h={mainAreaHeight - 20} justify="space-between">
                <Box>
                    <Select
                        label={t('SelectExistingCustomer')}
                        placeholder={t('ChooseCustomer')}
                        data={dropdownOptions}
                        searchable
                        clearable
                        value={selectedCustomerId}
                        onChange={handleCustomerDropdownChange}
                        size="sm"
                    />

                    <Divider mb="md" mt="lg" label={t('Or')} labelPosition="center" />

                    <Stack gap="sm">
                        <Text fw={600} size="sm">
                            {t('AddNewCustomer')}
                        </Text>

                        <TextInput
                            label={t('CustomerName')}
                            placeholder={t('EnterCustomerName')}
                            required
                            size="sm"
                            disabled={!!selectedCustomerId}
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
                                disabled={!!selectedCustomerId}
                                {...customerForm.getInputProps('mobile')}
                            />
                        </FormValidationWrapper>

                        <TextInput
                            label={t('Address')}
                            placeholder={t('EnterAddress')}
                            size="sm"
                            disabled={!!selectedCustomerId}
                            {...customerForm.getInputProps('address')}
                        />

                        <TextInput
                            label={t('Email')}
                            placeholder={t('EnterEmail')}
                            type="email"
                            size="sm"
                            disabled={!!selectedCustomerId}
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
