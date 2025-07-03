import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 }
      );
    }

    // Check if tweet exists
    const existingTweet = await prisma.tweet.findUnique({
      where: { id: id },
    });

    if (!existingTweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Delete the tweet
    await prisma.tweet.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Tweet deleted successfully",
      deletedTweetId: id,
    });
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return NextResponse.json(
      { error: "Failed to delete tweet" },
      { status: 500 }
    );
  }
}
