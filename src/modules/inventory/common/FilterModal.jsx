import { Drawer, Button, Box, Flex, Text, ScrollArea, ActionIcon, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { IconSearch, IconX } from "@tabler/icons-react";

export default function FilterModal({ setFilterModel, filterModel }) {
  const { t } = useTranslation();
  const { mainAreaHeight } = useOutletContext();
  const height = mainAreaHeight; //TabList height 104

  const closeModel = () => {
    setFilterModel(false);
  };

  return (
    <Drawer.Root opened={filterModel} position="right" onClose={closeModel} size={"30%"}>
      <Drawer.Overlay />
      <Drawer.Content>
        <ScrollArea h={height + 100} scrollbarSize={2} type="never" bg={"gray.1"}>
          <Group mih={40} justify="space-between">
            <Box>
              <Text fw={"600"} fz={"16"} ml={"md"}>
                {t("FilterData")}
              </Text>
            </Box>
            <ActionIcon
              mr={"sm"}
              radius="xl"
              color="red.6"
              size="md"
              onClick={closeModel}
            >
              <IconX style={{ width: "100%", height: "100%" }} stroke={1.5} />
            </ActionIcon>
          </Group>

          <Box ml={2} mr={2} mt={0} p={"xs"} className="borderRadiusAll" bg={"white"}>
            <Box bg={"white"} p={"xs"} className={"borderRadiusAll"} h={height - 37}>
              Module based
            </Box>
            <Box
              pl={`xs`}
              pr={8}
              pt={"6"}
              pb={"6"}
              mb={"2"}
              mt={4}
              className={"boxBackground borderRadiusAll"}
            >
              <Group justify="flex-end">
                <Button
                  size="xs"
                  color={`green.8`}
                  type="submit"
                  id={"submit"}
                  w={142}
                  onClick={() => {
                    closeModel();
                  }}
                  leftSection={<IconSearch size={16} />}
                >
                  <Flex direction={`column`} gap={0}>
                    <Text fz={14} fw={400}>
                      {t("Submit")}
                    </Text>
                  </Flex>
                </Button>
              </Group>
            </Box>
          </Box>
        </ScrollArea>
      </Drawer.Content>
    </Drawer.Root>
  );
}
