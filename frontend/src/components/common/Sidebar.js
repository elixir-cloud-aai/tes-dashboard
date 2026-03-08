import React from "react";
import { NavLink, Link } from "react-router-dom";
import styled from "styled-components";
import {
  ListTodo,
  Workflow,
  Network,
  Activity,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const SidebarContainer = styled.div`
  width: 260px;
  background-color: #ffffff;
  height: 100vh;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LogoContainer = styled(Link)`
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  border-bottom: 1px solid #f1f5f9;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const LogoText = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
`;

const NavContent = styled.div`
  flex: 1;
  padding: 24px 16px;
  overflow-y: auto;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 24px 0 12px 12px;

  &:first-child {
    margin-top: 0;
  }
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: #64748b;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 14px;

  & svg {
    margin-right: 12px;
    width: 18px;
    height: 18px;
  }

  &:hover {
    background-color: #f1f5f9;
    color: #1e293b;
  }

  &.active {
    background-color: #eff6ff;
    color: #3b82f6;
    font-weight: 600;

    & svg {
      color: #3b82f6;
    }

    & .chevron {
      opacity: 1;
    }
  }
`;

const NavItemContent = styled.div`
  display: flex;
  align-items: center;
`;

const ChevronIcon = styled(ChevronRight)`
  width: 14px !important;
  height: 14px !important;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const Footer = styled.div`
  padding: 20px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <LogoContainer to="/">
        <LogoIcon>
          <Activity size={20} />
        </LogoIcon>
        <LogoText>Fedarated Analytics</LogoText>
      </LogoContainer>

      <NavContent>
        <SectionLabel>Execution</SectionLabel>
        <StyledNavLink to="/tasks">
          <NavItemContent>
            <ListTodo />
            Tasks
          </NavItemContent>
          <ChevronIcon className="chevron" />
        </StyledNavLink>

        <StyledNavLink to="/workflows">
          <NavItemContent>
            <Workflow />
            Workflows
          </NavItemContent>
          <ChevronIcon className="chevron" />
        </StyledNavLink>

        <SectionLabel>Setup</SectionLabel>
        <StyledNavLink to="/api/service-info">
          <NavItemContent>
            <Network />
            TES Network
          </NavItemContent>
          <ChevronIcon className="chevron" />
        </StyledNavLink>

        <StyledNavLink
          to="/middleware"
          style={{ opacity: 0.5, pointerEvents: "none" }}
        >
          <NavItemContent>
            <ShieldCheck />
            Gateway & Middleware
          </NavItemContent>
          <ChevronIcon className="chevron" />
        </StyledNavLink>

        <SectionLabel>Diagnostics</SectionLabel>
        <StyledNavLink to="/utilities">
          <NavItemContent>
            <Activity />
            Dashboard API Test
          </NavItemContent>
          <ChevronIcon className="chevron" />
        </StyledNavLink>
      </NavContent>

      <Footer>proTES v1.0.0</Footer>
    </SidebarContainer>
  );
};

export default Sidebar;
