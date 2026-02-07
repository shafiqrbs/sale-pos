import { Box, Paper, Text, Group } from "@mantine/core";

export default function StatCard({ icon, label, value, color }) {
    return (
        <Paper p="md" radius="md" withBorder bg={`${color}.0`}>
            <Group gap="xs" mb="xs">
                <Box c={`${color}.6`}>{icon}</Box>
            </Group>
            <Text size="xs" c="dimmed" mb={4}>{label}</Text>
            <Text size="xl" fw={700} c={`${color}.7`}>{value}</Text>
        </Paper>
    );
}
