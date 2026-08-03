export function formatSnakeCase(value: string | undefined | null): string {
    if (!value) return '';
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    leader: 'Líder',
    rider: 'Piloto',
};

export function buildRideRoleLabels(roles: { slug: string; name: string }[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const role of roles) {
        map[role.slug] = role.name;
    }
    return map;
}

export function formatEnum(
    value: string | undefined | null,
    overrides: Record<string, string> = {}
): string {
    if (!value) return '';
    if (overrides[value]) return overrides[value];
    return formatSnakeCase(value);
}
