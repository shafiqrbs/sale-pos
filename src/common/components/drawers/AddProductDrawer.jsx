import { Divider, ScrollArea } from "@mantine/core";
import AddProductDrawerForm from "./AddProductDrawerForm.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import GlobalDrawer from "./GlobalDrawer.jsx";

export default function AddProductDrawer({
    productDrawer,
    closeProductDrawer,
    setStockProductRestore,
    focusField,
    fieldPrefix,
}) {
    const { mainAreaHeight } = useMainAreaHeight();

    return (
        <GlobalDrawer
            opened={productDrawer}
            onClose={closeProductDrawer}
            position="right"
            size="30%"
            title="Create Instant Product"
        >
            <Divider />
            <ScrollArea
                h={mainAreaHeight}
                scrollbarSize={2}
                type="never"
                bg="white"
            >
                <AddProductDrawerForm
                    closeProductDrawer={closeProductDrawer}
                    setStockProductRestore={setStockProductRestore}
                    focusField={focusField}
                    fieldPrefix={fieldPrefix}
                />
            </ScrollArea>
        </GlobalDrawer>
    );
}
