import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "all";

    const skip = (page - 1) * limit;

    let where = {};

    if (filter === "relevant") {
      where = { isRelevant: true };
    } else if (filter === "favorites") {
      where = { isFavorite: true };
    } else if (filter !== "all") {
      // Filter by category
      where = {
        categories: {
          contains: filter,
        },
      };
    }

    const tweets = await prisma.tweet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.tweet.count({ where });

    return NextResponse.json({
      tweets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use upsert to handle duplicates
    const tweet = await prisma.tweet.upsert({
      where: { tweetId: body.tweetId },
      update: {
        // Update existing tweet with new data
        authorUsername: body.authorUsername,
        authorName: body.authorName,
        content: body.content,
        url: body.url,
        likes: body.likes || 0,
        retweets: body.retweets || 0,
        replies: body.replies || 0,
        repliesData: body.repliesData ? JSON.stringify(body.repliesData) : null,
      },
      create: {
        // Create new tweet
        tweetId: body.tweetId,
        authorUsername: body.authorUsername,
        authorName: body.authorName,
        content: body.content,
        createdAt: new Date(body.createdAt),
        url: body.url,
        likes: body.likes || 0,
        retweets: body.retweets || 0,
        replies: body.replies || 0,
        repliesData: body.repliesData ? JSON.stringify(body.repliesData) : null,
      },
    });

    return NextResponse.json(tweet);
  } catch (error) {
    console.error("Error creating/updating tweet:", error);
    return NextResponse.json(
      { error: "Failed to create tweet" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await prisma.tweet.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} tweets`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting tweets:", error);
    return NextResponse.json(
      { error: "Failed to delete tweets" },
      { status: 500 }
    );
  }
}
