// ui/layouts/AdminLayout/Sidebar/SidebarIcon.tsx
// Resolves a SidebarIcon string name to the corresponding Lucide component.
// Keeping icons here means route config files stay JSX-free (plain .ts files).

import React from "react";
import {
    LayoutDashboard,
    School,
    Building2,
    Bus,
    Users,
    MapPin,
    Route,
    Navigation,
    ClipboardList,
    Bell,
    Cpu,
    UserCog,
    BarChart2,
    type LucideProps,
} from "lucide-react";
import type { SidebarIcon as SidebarIconName } from "@/core/types/routes";

const ICON_MAP: Record<SidebarIconName, React.FC<LucideProps>> = {
    LayoutDashboard,
    School,
    Building2,
    Bus,
    Users,
    MapPin,
    Route,
    Navigation,
    ClipboardList,
    Bell,
    Cpu,
    UserCog,
    BarChart2,
};

interface SidebarIconProps extends LucideProps {
    name: SidebarIconName;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ name, ...props }) => {
    const Icon = ICON_MAP[name];
    if (!Icon) return null;
    return <Icon {...props} />;
};

export default SidebarIcon;