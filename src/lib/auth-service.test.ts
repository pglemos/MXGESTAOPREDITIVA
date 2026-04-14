import { describe, it, expect, mock } from "bun:test";
import { getUserData } from "./auth-service";

describe("getUserData", () => {
  it("should return user data when supabase call is successful", async () => {
    const mockData = { role: "Owner", agency_id: "123" };
    const mockClient = {
      from: mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      }))
    } as any;

    const result = await getUserData("user-1", mockClient);
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
  });

  it("should return error object when supabase returns error", async () => {
    const mockError = { message: "DB Error" };
    const mockClient = {
      from: mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => Promise.resolve({ data: null, error: mockError }))
          }))
        }))
      }))
    } as any;

    const result = await getUserData("user-1", mockClient);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });

  it("should throw TIMEOUT_LIMIT error when request times out", async () => {
    const mockClient = {
      from: mock(() => ({
        select: mock(() => ({
          eq: mock(() => ({
            maybeSingle: mock(() => new Promise((resolve) => setTimeout(resolve, 50)))
          }))
        }))
      }))
    } as any;

    try {
      // Pass a very short timeout (e.g. 1ms) to force timeout
      await getUserData("user-1", mockClient, 1);
      // If no error is thrown, fail the test
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toBe("TIMEOUT_LIMIT");
    }
  });
});
