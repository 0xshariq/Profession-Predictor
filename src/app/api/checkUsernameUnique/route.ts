import { dbConnect } from '@/lib/dbConnect';
import UserModel from '@/models/User.models';
import { z } from 'zod';
import { usernameValidation } from '@/schemas/signUpSchema';
import { NextResponse } from 'next/server';

// Define a schema for username query validation
const UsernameQuerySchema = z.object({
  username: usernameValidation,
});

/**
 * GET handler for checking username availability
 * @param request - The incoming request object
 * @returns NextResponse indicating whether the username is available or not
 */
export async function GET(request: Request) {
  try {
    // Extract the username from the query parameters
    const { searchParams } = new URL(request.url);
    const usernameQueryParam = {
      username: searchParams.get('username')
    };

    // Validate the username using Zod schema
    const usernameValidationResult = UsernameQuerySchema.safeParse(usernameQueryParam);

    // Check if validation was successful
    if (!usernameValidationResult.success) {
      // If validation failed, return the error messages
      return NextResponse.json({ 
        success: false, 
        message: usernameValidationResult.error.errors[0].message
      }, { status: 400 });
    }

    // Connect to the database
    await dbConnect();

    // Check if a verified user with the given username already exists
    const existingVerifiedUser = await UserModel.findOne({ 
      username: usernameValidationResult.data.username, 
      isVerified: true 
    });

    if (existingVerifiedUser) {
      // If a verified user with this username exists, return an error
      return NextResponse.json({ 
        success: false, 
        message: "Username already exists" 
      }, { status: 400 });
    }

    // If no verified user with this username exists, it's available
    return NextResponse.json({ 
      success: true, 
      message: "Username is unique and available" 
    }, { status: 200 });

  } catch (error) {
    // Log any unexpected errors
    console.error("Error in Checking Username", error);

    // Return a generic error response
    return NextResponse.json({ 
      success: false, 
      message: "An unexpected error occurred while checking the username"
    }, { status: 500 });
  }
}

