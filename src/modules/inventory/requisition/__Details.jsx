import React, { useRef, useState } from 'react'
import SalesPrintThermal from '../common/SalesPrintThermal';
import { Box, Grid, Text, LoadingOverlay, Button, ScrollArea, Table } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import SalesPrintA4 from '@components/print-formats/SalesPrintA4';
import useConfigData from '@hooks/useConfigData';
import { formatCurrency } from '@utils/index';

export default function Details({ loading, viewData }) {
  const printRef = useRef();
  const { mainAreaHeight } = useOutletContext()
  const { t } = useTranslation();
  const [ printA4, setPrintA4 ] = useState(false);
  const { configData } = useConfigData();

  const salesItems = Array.isArray(viewData?.requisition_items)
    ? viewData?.requisition_items
    : JSON.parse(viewData?.requisition_items || "[]");

  const rows =
    Array.isArray(salesItems) &&
    salesItems?.map((element, index) => (
      <Table.Tr key={index}>
        <Table.Td fz="xs" width="20">
          {index + 1}
        </Table.Td>
        <Table.Td ta="left" fz="xs" width="300">
          {element?.item_name || element?.display_name || ""}
        </Table.Td>
        <Table.Td ta="center" fz="xs" width="60">
          {element?.quantity}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="80">
          {element?.unit_name}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="80">
          {formatCurrency(element?.sales_price)}
        </Table.Td>
        <Table.Td ta="right" fz="xs" width="100">
          {formatCurrency(element?.sub_total)}
        </Table.Td>
      </Table.Tr>
    ));

  // const dueOrReturnValue = Number(viewData.total) - Number(viewData.payment);

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
        <Box h={'70'}>
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
                    {viewData?.vendor_name || "N/A"}
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
                    {viewData?.vendor_mobile || "N/A"}
                  </Text>
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span="4">
              <Grid columns={15} gutter={{ base: 4 }}>
                <Grid.Col span={6}>
                  <Text fz="sm" lh="xs">
                    {t("Created")}
                  </Text>
                </Grid.Col>
                <Grid.Col span={9}>
                  <Text fz="sm" lh="xs">
                    {viewData?.created}
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
                    {viewData?.createdByName || "N/A"}
                  </Text>
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span="2">
              <Button.Group mb="1">
                <Button
                  size={'compact-xs'}
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
                {/*<SalesPrintThermal salesViewData={viewData} salesItems={salesItems} />*/}
              </Button.Group>
            </Grid.Col>
          </Grid>
        </Box>
        <Box fz="sm">
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
                    {formatCurrency(viewData.sub_total)}
                  </Table.Th>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </ScrollArea>
        </Box>
      </Box>
      {printA4 && (
        <div style={{ display: "none" }}>
          <SalesPrintA4 salesViewData={viewData} configData={configData} setPrintA4={setPrintA4} salesItems={salesItems} />
        </div>
      )}
    </>
  )
}
