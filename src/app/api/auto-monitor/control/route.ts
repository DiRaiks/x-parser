import { NextRequest, NextResponse } from "next/server";
import {
  startAutoMonitoring,
  stopAutoMonitoring,
  getMonitoringStatus,
  setMonitoringCredentials,
  clearMonitoringCredentials,
  runManualMonitoring,
} from "@/lib/auto-monitor";

export async function GET() {
  try {
    const status = getMonitoringStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Error getting monitoring status:", error);
    return NextResponse.json(
      { error: "Failed to get monitoring status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, auth_token, ct0 } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "start":
        if (!auth_token || !ct0) {
          return NextResponse.json(
            {
              error: "Twitter session credentials required to start monitoring",
            },
            { status: 400 }
          );
        }
        try {
          setMonitoringCredentials(auth_token, ct0);
          const startResult = startAutoMonitoring();
          return NextResponse.json({
            success: startResult,
            message: startResult
              ? "Auto-monitoring started successfully"
              : "Failed to start auto-monitoring",
            status: getMonitoringStatus(),
          });
        } catch (error) {
          console.error("Error in start action:", error);
          return NextResponse.json(
            { error: `Failed to start monitoring: ${error}` },
            { status: 500 }
          );
        }

      case "stop":
        stopAutoMonitoring();
        return NextResponse.json({
          success: true,
          message: "Auto-monitoring stopped",
          status: getMonitoringStatus(),
        });

      case "credentials":
        if (!auth_token || !ct0) {
          return NextResponse.json(
            { error: "Twitter session credentials required" },
            { status: 400 }
          );
        }
        try {
          setMonitoringCredentials(auth_token, ct0);
          return NextResponse.json({
            success: true,
            message: "Session credentials updated",
            status: getMonitoringStatus(),
          });
        } catch (error) {
          console.error("Error in credentials action:", error);
          return NextResponse.json(
            { error: `Failed to update credentials: ${error}` },
            { status: 500 }
          );
        }

      case "clear_credentials":
        clearMonitoringCredentials();
        return NextResponse.json({
          success: true,
          message: "Session credentials cleared",
          status: getMonitoringStatus(),
        });

      case "manual_run":
        if (!auth_token || !ct0) {
          return NextResponse.json(
            { error: "Twitter session credentials required for manual run" },
            { status: 400 }
          );
        }
        setMonitoringCredentials(auth_token, ct0);
        const manualResult = await runManualMonitoring();
        return NextResponse.json({
          success: manualResult.success,
          message: manualResult.message,
          status: getMonitoringStatus(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error controlling auto-monitoring:", error);
    return NextResponse.json(
      { error: "Failed to control auto-monitoring" },
      { status: 500 }
    );
  }
}
