import { useState, useMemo } from "react";
import { Box, Grid, Tabs } from "@mantine/core";
import Table from "./_Table";
import tabCss from "@assets/css/Tab.module.css";
import { useOutletContext } from "react-router";
import useSalesList from "@hooks/useSalesList";

// =============== static tab options for sales views ================
const TAB_OPTIONS = [
    { key: "all", label: "All Sales" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "cash", label: "Cash Sales" },
    { key: "discount_type", label: "Flat Sales" },
];

export default function SalesIndex() {
    const { isOnline } = useOutletContext();
    const [ activeTab, setActiveTab ] = useState("all");
    const { sales: salesData, isLoading } = useSalesList({ params: { term: "", customer_id: "", start_date: "", end_date: "", page: 1, offset: 50 }, offlineFetch: !isOnline });

    // =============== filter logic for each tab ================
    const filteredData = useMemo(() => {
        if (!salesData?.data.length) return { ...salesData, data: [] };

        const sales = salesData.data;
        const now = new Date();

        if (activeTab === "today") {
            const result = {
                ...salesData,
                data: sales.filter((item) => {
                    if (!item.created) return false;

                    const [ day, month, year ] = item.created.split("-");
                    const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
                    return (
                        itemDate.getDate() === now.getDate() &&
                        itemDate.getMonth() === now.getMonth() &&
                        itemDate.getFullYear() === now.getFullYear()
                    );
                }),
            };
            console.info(result);
            return result;
        }
        if (activeTab === "week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const result = {
                ...salesData,
                data: sales.filter((item) => {
                    if (!item.created) return false;
                    const [ day, month, year ] = item.created.split("-");
                    const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
                    return itemDate >= startOfWeek && itemDate <= endOfWeek;
                }),
            };
            console.info(result);
            return result;
        }
        if (activeTab === "month") {
            const result = {
                ...salesData,
                data: sales.filter((item) => {
                    if (!item.created) return false;
                    const [ day, month, year ] = item.created.split("-");
                    const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                }),
            };
            console.info(result);
            return result;
        }
        if (activeTab === "cash") {
            const result = {
                ...salesData,
                data: sales.filter((item) => item.mode_name?.toLowerCase() === "cash"),
            };
            console.info(result);
            return result;
        }
        if (activeTab === "discount_type") {
            const result = {
                ...salesData,
                data: sales.filter((item) => item.discount_type?.toLowerCase() === "flat"),
            };
            console.info(result);
            return result;
        }
        // default: all
        return salesData;
    }, [ activeTab, salesData ]);

    return (
        <Grid columns={24} gutter={{ base: 8 }}>
            <Grid.Col span={4}>
                <p>Sales Overview</p>
                <Box mt={8} mb={18} h={2} w="56px" bg="red" />
                {/* =============== mantine tabs with custom style ================ */}
                <Tabs
                    color="#f8eedf"
                    value={activeTab}
                    onChange={setActiveTab}
                    variant="pills"
                    keepMounted={false}
                    orientation="vertical"
                    w="100%"
                    styles={{
                        tab: {
                            background: "#f1f3f5",
                        },
                    }}
                    classNames={{
                        tab: tabCss.tab,
                    }}
                >
                    <Tabs.List w="100%">
                        {TAB_OPTIONS.map((tab) => (
                            <Tabs.Tab key={tab.key} value={tab.key} h={40} w="100%">
                                {tab.label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs>
                {/* =============== sales table for selected tab ================ */}
            </Grid.Col>
            <Grid.Col span={20}>
                <Table salesData={filteredData} fetching={isLoading} />
            </Grid.Col>
        </Grid>
    );
}
