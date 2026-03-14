import { Colors, Spacing, Typography } from '@/src/theme';
import { type Icon } from 'phosphor-react-native';
import { Link, usePathname, type Href } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSidebarStore } from '@/src/stores/useSidebarStore';

interface SidebarItemProps {
  icon: Icon;
  label: string;
  href: Href;
}

export function SidebarItem({ icon: Icon, label, href }: SidebarItemProps) {
  const pathname = usePathname();
  const close = useSidebarStore((s) => s.close);

  const hrefStr = typeof href === 'string' ? href : String(href);
  const isActive = pathname.includes(hrefStr.replace('/(main)', ''));

  return (
    <Link href={href} asChild onPress={close}>
      <TouchableOpacity style={styles.itemWrapper} activeOpacity={0.7}>
        <View style={[styles.chip, isActive && styles.chipActive]}>
          <Icon size={20} color={Colors.white} weight={isActive ? 'bold' : 'regular'} />
          <Text style={styles.label}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  itemWrapper: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingLeft: Spacing[4],
    paddingRight: Spacing[5],
    paddingVertical: 12,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingLeft: Spacing[4],
    paddingRight: Spacing[5],
    paddingVertical: 12,
    borderRadius: 20,
  },
  label: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    letterSpacing: 0.2,
  },
});
