import { describe, expect, it } from "vitest";
import { clockAt, fmtClock, reasonKey, stepOf, timeControlLabel, unfinished, type MyGame } from "./live-games";

describe("how a game ended", () => {
  it("reads Lichess's endings in the board's own words", () => {
    expect(reasonKey("lichess:outoftime")).toBe("TimeOut");
    expect(reasonKey("lichess:resign")).toBe("Resignation");
    expect(reasonKey("Agreement")).toBe("Agreement");
    expect(reasonKey("lichess:unheardOf")).toBe("");
    expect(reasonKey(undefined)).toBe("");
  });
});

describe("the clock", () => {
  const at = "2026-09-28T09:00:00.000Z";
  it("runs only the side to move, and only while the game is on", () => {
    const clock = { whiteMs: 60_000, blackMs: 30_000, at };
    expect(clockAt(clock, "Black", true, Date.parse(at) + 4_000)).toEqual({ white: 60_000, black: 26_000 });
    expect(clockAt(clock, "Black", false, Date.parse(at) + 4_000)).toEqual({ white: 60_000, black: 30_000 });
    expect(clockAt(undefined, "White", true, 0)).toBeNull();
  });

  it("reads as a clock", () => {
    expect(fmtClock(247_000)).toBe("4:07");
    expect(fmtClock(9_400)).toBe("0:09.4");
    expect(timeControlLabel({ limit: 900, increment: 10 })).toBe("15+10");
  });
});

describe("games waiting for the pupil", () => {
  const game = (status: MyGame["status"]): MyGame => ({
    gameRoomId: status, status, white: null, black: null, lichessRated: false, createdAt: "",
  });
  it("keeps the ones still to play", () => {
    expect(unfinished([game("Active"), game("Finished"), game("Open"), game("Cancelled")]).map((g) => g.status))
      .toEqual(["Active", "Open"]);
  });
});

describe("where a pupil stands with a game the office set up", () => {
  const me = "usr_me";
  const game = (over: Partial<MyGame>): MyGame => ({
    gameRoomId: "g", status: "Open", lichessRated: false, createdAt: "",
    white: { userAccountId: me, displayName: "Me" }, black: { userAccountId: "usr_noe", displayName: "Noe" },
    ...over,
  });
  it("is invited until they press Enter", () => {
    expect(stepOf(game({}), me)).toBe("invited");
  });
  it("waits once they have entered and the other has not", () => {
    expect(stepOf(game({ whiteEntered: true }), me)).toBe("waitingForOpponent");
    expect(stepOf(game({ blackEntered: true }), me)).toBe("invited");
  });
  it("is in play once both have", () => {
    expect(stepOf(game({ status: "Active", whiteEntered: true, blackEntered: true }), me)).toBe("inPlay");
  });
});

describe("a game the office paused", () => {
  it("is paused for the pupil, whatever they had pressed", () => {
    const game: MyGame = {
      gameRoomId: "g", status: "Open", stopped: true, lichessRated: false, createdAt: "",
      white: { userAccountId: "usr_me", displayName: "Me" }, black: { userAccountId: "usr_noe", displayName: "Noe" },
    };
    expect(stepOf(game, "usr_me")).toBe("onHold");
    expect(stepOf({ ...game, whiteEntered: true, blackEntered: true }, "usr_me")).toBe("onHold");
  });
});
