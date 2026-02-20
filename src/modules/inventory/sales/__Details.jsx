import React, { useRef, useState } from 'react'
import SalesPrintThermal from '../common/SalesPrintThermal';
import { Box, Grid, Text, LoadingOverlay, Button, ScrollArea, Table } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import SalesPrintA4 from '@components/print-formats/SalesPrintA4';
import useConfigData from '@hooks/useConfigData';

export default function Details({ loading, salesViewData }) {
  const printRef = useRef();
  const { isOnline, mainAreaHeight } = useOutletContext()
  const { t } = useTranslation();
  const [ printA4, setPrintA4 ] = useState(false);
  const { configData } = useConfigData({ offlineFetch: !isOnline });

  const salesItems = isOnline
    ? salesViewData?.sales_items
    : Array.isArray(salesViewData?.sales_items)
      ? salesViewData?.sales_items
      : JSON.parse(salesViewData?.sales_items || "[]");

  const rows =
    Array.isArray(salesItems) &&
    salesItems?.map((element, index) => (
      <Table.Tr key={index}>
        <Table.Td fz="xs" width="20">
          {index + 1}
        </Table.Td>
        <Table.Td ta="left" fz="xs" width="300">
          {element?.name || element?.display_name || ""}
        </Table.Td>
        <Table.Td ta="center" fz="xs" width="60">
          {element?.quantity}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="80">
          {element?.uom}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="80">
          {element?.sales_price}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="100">
          {element?.sub_total}
        </Table.Td>
      </Table.Tr>
    ));

  const dueOrReturnValue = Number(salesViewData.total) - Number(salesViewData.payment);

  return (
    <>
      <Box bd="1px solid #dee2e6" bg="white" p="3xs" className="borderRadiusAll" ref={printRef} pos="relative">
        {loading && (
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
            loaderProps={{ color: "red" }}
          />
        )}
        <Box
          h="36"
          px="xs"
          fz="sm"
          fw="600"
          pt="6"
          mb="4"
          className="boxBackground textColor borderRadiusAll"
        >
          {t("Invoice")}:{" "}
          {salesViewData?.invoice}
        </Box>
        <Box className="borderRadiusAll" fz="sm">
          <ScrollArea h={102} type="never">
            <Box
              fz="sm"
              fw="600"
              px="xs"
              pt="6"
              pb="xs"
              className="boxBackground textColor"
            >
              <Grid gutter={{ base: 4 }}>
                <Grid.Col span="6">
                  <Grid columns={15} gutter={{ base: 4 }}>
                    <Grid.Col span={6}>
                      <Text fz="sm" lh="xs">
                        {t("Customer")}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={9}>
                      <Text fz="sm" lh="xs">
                        {salesViewData.customerName || "N/A"}
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
                        {salesViewData.customerMobile || "N/A"}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Grid.Col>
                <Grid.Col span="6">
                  <Grid columns={15} gutter={{ base: 4 }}>
                    <Grid.Col span={6}>
                      <Text fz="sm" lh="xs">
                        {t("Created")}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={9}>
                      <Text fz="sm" lh="xs">
                        {salesViewData.created}
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
                        {salesViewData.salesByUser || "N/A"}
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
                        {salesViewData?.multi_transaction ? "Multi Transaction" : salesViewData?.mode_name}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Grid.Col>
              </Grid>
            </Box>
          </ScrollArea>
          <ScrollArea h={mainAreaHeight - 246} scrollbarSize={2} type="never">
            <Table stickyHeader className='sales-details-table'>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th fz="xs" w="20">
                    {t("S/N")}
                  </Table.Th>
                  <Table.Th fz="xs" ta="left" w="300">
                    {t("Name")}
                  </Table.Th>
                  <Table.Th fz="xs" ta="center" w="60">
                    {t("QTY")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="80">
                    {t("UOM")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="80">
                    {t("Price")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {t("SubTotal")}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th colSpan="5" ta="right" fz="xs" w="100">
                    {t("SubTotal")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {salesViewData.sub_total}
                  </Table.Th>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th colSpan="5" ta="right" fz="xs" w="100">
                    {t("Discount")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {salesViewData.discount}
                  </Table.Th>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th colSpan="5" ta="right" fz="xs" w="100">
                    {t("Total")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {salesViewData.total}
                  </Table.Th>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th colSpan="5" ta="right" fz="xs" w="100">
                    {t("Receive")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {salesViewData.payment}
                  </Table.Th>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th colSpan="5" ta="right" fz="xs" w="100">
                    {dueOrReturnValue >= 0 ? t("Due") : t("Return")}
                  </Table.Th>
                  <Table.Th ta="right" fz="xs" w="100">
                    {Math.abs(dueOrReturnValue)}
                  </Table.Th>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </ScrollArea>
        </Box>
        <Button.Group mb="1">
          <Button
            fullWidth
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
        </Button.Group>
      </Box>
      {printA4 && (
        <div style={{ display: "none" }}>
          <SalesPrintA4 salesViewData={salesViewData} configData={configData} setPrintA4={setPrintA4} salesItems={salesItems} />
        </div>
      )}
    </>
  )
}
