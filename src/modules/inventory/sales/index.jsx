import { useState } from "react";
import { Box, Grid, Tabs } from "@mantine/core";
import Table from "./_Table";
import tabCss from "@assets/css/Tab.module.css";
import { useOutletContext } from "react-router";

const TAB_OPTIONS = [
    { key: "all", label: "All Sales" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "cash", label: "Cash Sales" },
    { key: "discount_type", label: "Flat Sales" },
];

export default function SalesIndex() {
    const [ activeTab, setActiveTab ] = useState("all");
    const { mainAreaHeight } = useOutletContext();

    return (
        <Box p="xs">
            <Grid columns={24} gutter={{ base: 8 }}>
                <Grid.Col span={3}>
                    <Box h={mainAreaHeight - 2} p="3xs" className="borderRadiusAll" bg="white" bd="1px solid #e6e6e6">
                        <p>Sales Overview</p>
                        <Box mt={8} mb={18} h={2} w="56px" bg="var(--theme-primary-color-6)" />
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
                    </Box>
                </Grid.Col>
                <Grid.Col span={21}>
                    <Table activeTab={activeTab} />
                </Grid.Col>
            </Grid>
        </Box>
    );
}
