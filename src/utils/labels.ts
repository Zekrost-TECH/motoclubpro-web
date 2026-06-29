export function formatSnakeCase(value: string | undefined | null): string {
    if (!value) return '';
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEnum(
    value: string | undefined | null,
    overrides: Record<string, string> = {}
): string {
    if (!value) return '';
    if (overrides[value]) return overrides[value];
    return formatSnakeCase(value);
}
