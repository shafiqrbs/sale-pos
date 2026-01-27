import React, { useRef, useState } from 'react'
import SalesPrintThermal from '../common/SalesPrintThermal';
import { Box, Grid, Text, ActionIcon, Group, Menu, LoadingOverlay, Button, ScrollArea, Flex, Table } from '@mantine/core';
import { IconPrinter, IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router';

export default function SalesDetails({ loading, salesViewData, salesData }) {
  const printRef = useRef();
  const { isOnline, mainAreaHeight } = useOutletContext()
  const { t } = useTranslation();
  const [ printA4, setPrintA4 ] = useState(false);
  const navigate = useNavigate();


  const salesItems = isOnline
    ? salesData?.sales_items
    : Array.isArray(salesData?.sales_items)
      ? salesData?.sales_items
      : JSON.parse(salesData?.sales_items || "[]");


  const rows =
    Array.isArray(salesItems) &&
    salesItems?.map((element, index) => (
      <Table.Tr key={element.name + index}>
        <Table.Td fz="xs" width={"20"}>
          {index + 1}
        </Table.Td>
        <Table.Td ta="left" fz="xs" width={"300"}>
          {element?.name || element?.display_name || ""}
        </Table.Td>
        <Table.Td ta="center" fz="xs" width={"60"}>
          {element?.quantity}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width={"80"}>
          {element?.uom}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width={"80"}>
          {element?.sales_price}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width={"100"}>
          {element?.sub_total}
        </Table.Td>
      </Table.Tr>
    ));

  return (
    <>
      <Grid.Col span={8}>
        <Box bg={"white"} p={"xs"} className={"borderRadiusAll"} ref={printRef} pos="relative">
          {loading && (
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "red" }}
            />
          )}
          <Box
            h={"36"}
            pl={`xs`}
            fz={"sm"}
            fw={"600"}
            pr={8}
            pt={"6"}
            mb={"4"}
            className={"boxBackground textColor borderRadiusAll"}
          >
            {t("Invoice")}:{" "}
            {salesViewData && salesViewData.invoice && salesViewData.invoice}
          </Box>
          <Box className={"borderRadiusAll"} fz={"sm"}>
            <ScrollArea h={122} type="never">
              <Box
                pl={`xs`}
                fz={"sm"}
                fw={"600"}
                pr={"xs"}
                pt={"6"}
                pb={"xs"}
                className={"boxBackground textColor"}
              >
                <Grid gutter={{ base: 4 }}>
                  <Grid.Col span={"6"}>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Customer")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.customerName &&
                            salesViewData.customerName}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Mobile")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.customerMobile &&
                            salesViewData.customerMobile}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Address")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.customer_address &&
                            salesViewData.customer_address}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Balance")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData && salesViewData.balance
                            ? Number(salesViewData.balance).toFixed(2)
                            : 0.0}
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Grid.Col>
                  <Grid.Col span={"6"}>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Created")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.created &&
                            salesViewData.created}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("CreatedBy")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.createdByName &&
                            salesViewData.createdByName}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("SalesBy")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.salesByUser &&
                            salesViewData.salesByUser}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Mode")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.mode_name &&
                            salesViewData.mode_name}
                        </Text>
                      </Grid.Col>
                    </Grid>
                    <Grid columns={15} gutter={{ base: 4 }}>
                      <Grid.Col span={6}>
                        <Text fz="sm" lh="xs">
                          {t("Process")}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={9}>
                        <Text fz="sm" lh="xs">
                          {salesViewData &&
                            salesViewData.process &&
                            salesViewData.process}
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Grid.Col>
                </Grid>
              </Box>
            </ScrollArea>
            <ScrollArea h={mainAreaHeight - 220} scrollbarSize={2} type="never">
              <Box>
                <Table stickyHeader>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th fz="xs" w={"20"}>
                        {t("S/N")}
                      </Table.Th>
                      <Table.Th fz="xs" ta="left" w={"300"}>
                        {t("Name")}
                      </Table.Th>
                      <Table.Th fz="xs" ta="center" w={"60"}>
                        {t("QTY")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"80"}>
                        {t("UOM")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"80"}>
                        {t("Price")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {t("SubTotal")}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rows}</Table.Tbody>
                  <Table.Tfoot>
                    <Table.Tr>
                      <Table.Th colSpan={"5"} ta="right" fz="xs" w={"100"}>
                        {t("SubTotal")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {salesViewData &&
                          salesViewData.sub_total &&
                          Number(salesViewData.sub_total).toFixed(2)}
                      </Table.Th>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th colSpan={"5"} ta="right" fz="xs" w={"100"}>
                        {t("Discount")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {salesViewData &&
                          salesViewData.discount &&
                          Number(salesViewData.discount).toFixed(2)}
                      </Table.Th>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th colSpan={"5"} ta="right" fz="xs" w={"100"}>
                        {t("Total")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {salesViewData &&
                          salesViewData.total &&
                          Number(salesViewData.total).toFixed(2)}
                      </Table.Th>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th colSpan={"5"} ta="right" fz="xs" w={"100"}>
                        {t("Receive")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {salesViewData &&
                          salesViewData.payment &&
                          Number(salesViewData.payment).toFixed(2)}
                      </Table.Th>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th colSpan={"5"} ta="right" fz="xs" w={"100"}>
                        {t("Due")}
                      </Table.Th>
                      <Table.Th ta="right" fz="xs" w={"100"}>
                        {salesViewData &&
                          salesViewData.total &&
                          (
                            Number(salesViewData.total) -
                            Number(salesViewData.payment)
                          ).toFixed(2)}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </Box>
            </ScrollArea>
          </Box>
          <Button.Group mb={"1"}>
            <Button
              fullWidth={true}
              variant="filled"
              leftSection={<IconPrinter size={14} />}
              color="green.5"
              onClick={() => {
                setPrintA4(true);
              }}
            >
              {t("Print")}
            </Button>
            <SalesPrintThermal salesViewData={salesViewData} salesItems={salesItems} />
            {isOnline && (
              <Button
                onClick={() => navigate(`/inventory/sales/edit/${salesViewData?.id}`)}
                component="a"
                fullWidth={true}
                variant="filled"
                leftSection={<IconEdit size={14} />}
                color="cyan.5"
              >
                {t("Edit")}
              </Button>
            )}
          </Button.Group>
        </Box>
        {printA4 && (
          <div style={{ display: "none" }}>
            <SalesPrintA4 salesViewData={salesViewData} setPrintA4={setPrintA4} salesItems={salesItems} />
          </div>
        )}
      </Grid.Col>
    </>
  )
}
