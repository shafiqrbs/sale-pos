import { useOutletContext } from "react-router";
import { ActionIcon, Box, ScrollArea, Drawer, Flex } from "@mantine/core";

import { IconX } from "@tabler/icons-react";

export default function CustomerGroupDrawer({ groupDrawer, setGroupDrawer }) {
    const { mainAreaHeight } = useOutletContext();
    const height = mainAreaHeight;

    const closeDrawer = () => {
        setGroupDrawer(false)
    }

    return (
        <>
            <Drawer.Root opened={groupDrawer} position="right" onClose={closeDrawer} size={'30%'}  >
                <Drawer.Overlay />
                <Drawer.Content>
                    <ScrollArea h={height + 100} scrollbarSize={2} type="never" bg={'gray.1'}>
                        <Flex
                            mih={40}
                            gap="md"
                            justify="flex-end"
                            align="center"
                            direction="row"
                            wrap="wrap"
                        >
                            <ActionIcon
                                mr={'sm'}
                                radius="xl"
                                color='var(--theme-remove-color)' size="md"
                                onClick={closeDrawer}
                            >
                                <IconX style={{ width: '100%', height: '100%' }} stroke={1.5} />
                            </ActionIcon>
                        </Flex>

                        <Box ml={2} mr={2} mb={0}>
                            {/* <SettingsForm setGroupDrawer={setGroupDrawer} settingTypeDropdown={settingTypeDropdown} saveId={saveId} /> */}
                        </Box>
                    </ScrollArea>

                </Drawer.Content>
            </Drawer.Root >
        </>

    );
}
