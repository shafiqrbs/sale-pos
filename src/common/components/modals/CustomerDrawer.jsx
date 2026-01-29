import React, { useState, useEffect } from 'react';
import { Drawer, Stack, Select, TextInput, Button, Divider, Group, Text, rem } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime, generateSlug } from '@utils/index';
import { showNotification } from '@components/ShowNotificationComponent';

export default function CustomerDrawer({ opened, onClose, form, customersDropdownData, onCustomerSelect }) {
    const { t } = useTranslation();
    const [ selectedCustomerId, setSelectedCustomerId ] = useState(null);
    const [ isLoading, setIsLoading ] = useState(false);

    const newCustomerForm = useForm({
        initialValues: {
            name: '',
            mobile: '',
            address: '',
            email: '',
        },
        validate: {
            name: (value) => (!value || value.trim() === '' ? t('NameIsRequired') || 'Name is required' : null),
            mobile: (value) => (!value || value.trim() === '' ? t('MobileIsRequired') || 'Mobile is required' : null),
        },
    });

    // =============== reset form when drawer closes and set initial customer when opened ================
    useEffect(() => {
        if (!opened) {
            setSelectedCustomerId(null);
            newCustomerForm.reset();
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
        const validation = newCustomerForm.validate();
        if (!validation.hasErrors) {
            setIsLoading(true);
            try {
                const customerData = newCustomerForm.values;

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
        <Drawer
            position="right"
            opened={opened}
            onClose={onClose}
            padding="lg"
            size="md"
            overlayProps={{
                backgroundOpacity: 0.55,
            }}
            title={t('SelectCustomer') || 'Select Customer'}
            styles={{
                title: { fontWeight: 600, fontSize: rem(20), color: '#626262' },
            }}
        >
            <Divider mb="md" />

            <Stack gap="md">
                <Select
                    label={t('SelectExistingCustomer') || 'Select Existing Customer'}
                    placeholder={t('ChooseCustomer') || 'Choose Customer'}
                    data={dropdownOptions}
                    searchable
                    clearable
                    value={selectedCustomerId}
                    onChange={handleCustomerDropdownChange}
                    size="sm"
                />

                <Divider label={t('Or') || 'OR'} labelPosition="center" />

                <Stack gap="sm">
                    <Text fw={600} size="sm">
                        {t('AddNewCustomer')}
                    </Text>

                    <TextInput
                        label={t('CustomerName')}
                        placeholder={t('EnterCustomerName') || 'Enter customer name'}
                        required
                        size="sm"
                        disabled={!!selectedCustomerId}
                        {...newCustomerForm.getInputProps('name')}
                    />

                    <TextInput
                        label={t('Mobile') || 'Mobile'}
                        placeholder={t('EnterMobileNumber') || 'Enter mobile number'}
                        required
                        size="sm"
                        disabled={!!selectedCustomerId}
                        {...newCustomerForm.getInputProps('mobile')}
                    />

                    <TextInput
                        label={t('Address')}
                        placeholder={t('EnterAddress') || 'Enter address (optional)'}
                        size="sm"
                        disabled={!!selectedCustomerId}
                        {...newCustomerForm.getInputProps('address')}
                    />

                    <TextInput
                        label={t('Email')}
                        placeholder={t('EnterEmail')}
                        type="email"
                        size="sm"
                        disabled={!!selectedCustomerId}
                        {...newCustomerForm.getInputProps('email')}
                    />
                </Stack>

                {/* =============== action buttons ================ */}
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={onClose} size="sm">
                        {t('Cancel')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        size="sm"
                        loading={isLoading}
                        disabled={!selectedCustomerId && (!newCustomerForm.values.name || !newCustomerForm.values.mobile)}
                    >
                        {t('Save')}
                    </Button>
                </Group>
            </Stack>
        </Drawer>
    );
}
