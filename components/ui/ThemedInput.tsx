import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemedInputProps extends TextInputProps {
    icon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
}

export const ThemedInput = ({ icon: Icon, rightIcon: RightIcon, onRightIconPress, style, ...props }: ThemedInputProps) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            {Icon && <Icon size={20} color={colors.textSecondary} style={styles.icon} />}
            <TextInput
                style={[styles.input, { color: colors.text }, style]}
                placeholderTextColor={colors.textMuted}
                {...props}
            />
            {RightIcon && (
                <RightIcon
                    size={20}
                    color={colors.textSecondary}
                    onPress={onRightIconPress}
                    style={styles.rightIcon}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F1F2E',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2D2D3F',
    },
    icon: {
        marginRight: 12,
    },
    rightIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
});
