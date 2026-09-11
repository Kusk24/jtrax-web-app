/**
 * The two "friend" doors, and the rule that they never share a name.
 *
 * The portal has two different ways to play a person, and they shipped wearing
 * almost the same label: the home card said "Play with a Friend" and the play
 * menu said "Play a friend" — identical in Thai (เล่นกับเพื่อน), and the home
 * card's own subtitle described the *other* one's flow. These pin the two
 * apart in both languages, because a child reading Thai got no signal at all.
 */
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import th from "../../messages/th.json";

const locales = { en, th } as const;

describe.each(Object.entries(locales))("%s labels", (_locale, m) => {
  it("names the invite flow and the code flow differently", () => {
    expect(m.sv2.playFriend).not.toBe(m.play.vsFriend);
  });

  it("gives the live board its own title, not the door's", () => {
    // "Join a class game" is what you click; it is not what you are looking at
    // once you are sitting at the board.
    expect(m.play.classGame).toBeTruthy();
    expect(m.play.classGame).not.toBe(m.play.vsFriend);
  });
});

describe("the home card's subtitle", () => {
  it("describes inviting, not entering a code", () => {
    // It leads to /student/challenge, where there is no code to type. Saying
    // "enter a code" there is the bug this replaced.
    expect(en.sv2.playTogether.toLowerCase()).not.toContain("code");
    expect(th.sv2.playTogether).not.toContain("รหัส");
  });

  it("still tells the code flow that a code is what it wants", () => {
    expect(en.play.vsFriendBody.toLowerCase()).toContain("code");
    expect(th.play.vsFriendBody).toContain("รหัส");
  });
});
