# Debug Battle Solution

Date: 2026-07-18

## Project 

- Frontend app is in `frontend`.
- Backend app is in `backend/src`.
- Dependencies installed in both app folders:
  - `frontend`: `npm install`
  - `backend/src`: `npm install`
- Reviewed frontend source, backend source, route/config files, package files, schemas, services, models, socket/game logic, CSS, and app metadata/config files.

## Bugs Found And Fixed

### 1. Frontend landing CTA used a non-existent route

- File: `frontend/src/pages/LandingPage.jsx`
- Broken code: `navigate('/auth/signup')`
- Problem: App routes define signup as `/signup`, not `/auth/signup`, so the Start Game button could route to an invalid path and fall back home.
- Fix: Imported `ROUTES` and changed navigation to `navigate(ROUTES.SIGNUP)`.

### 2. Logout did not clear the stored access token

- File: `frontend/src/store/authSlice.js`
- Broken code: `localStorage.removeItem('token')`
- Problem: Login stores the token under `accessToken`, but logout removed `token`, leaving stale auth data in localStorage.
- Fix: Changed removal key to `accessToken`.

### 3. Signup avatar selection deleted previous form-step data

- File: `frontend/src/features/auth/hooks/useSignup.js`
- Broken code: `setFormData(() => ({ avatar: avatar.url }))`
- Problem: Selecting an avatar replaced the entire signup data object, wiping `username`, `password`, and `fullName`.
- Fix: Merged with previous form data using `setFormData((prev) => ({ ...prev, avatar: avatar.url }))`.

### 4. Online optimistic move showed the wrong mark and kept the same turn

- File: `frontend/src/features/game/providers/GameProvider.jsx`
- Broken code: used `prev.isXTurn ? 'O' : 'X'` and left `isXTurn` unchanged.
- Problem: The local board displayed the opposite mark and allowed the same player to continue clicking before the server update arrived.
- Fix: Placed `X` when `isXTurn` is true, `O` otherwise, and toggled `isXTurn` optimistically.

### 5. Online game ignored server match updates

- File: `frontend/src/features/game/providers/GameProvider.jsx`
- Broken code: `onMatchUpdate` only handled countdown state.
- Problem: The server broadcasted updated board/score/turn data, but the client never wrote it into `match`, causing stale UI.
- Fix: Added `setMatch(updatedMatch)` at the start of the match update handler.

### 6. Friends online indicator was reversed in the header

- File: `frontend/src/features/game/components/GameHeader.jsx`
- Broken code: online users got gray status, offline users got green.
- Problem: UI showed wrong presence state.
- Fix: Swapped the conditional classes so online is green and offline is muted gray.

### 7. Game invite toast buttons performed the opposite actions

- File: `frontend/src/features/game/components/GameHeader.jsx`
- Broken code: Decline called `accept`, Accept called `reject`.
- Problem: User clicking Accept rejected the invite and clicking Decline accepted it.
- Fix: Decline now sends `reject`; Accept now sends `accept`.

### 8. Online score panel showed X and O scores swapped

- File: `frontend/src/features/game/components/OnlineGame.jsx`
- Broken code: `XScore={match.scores?.O}` and `OScore={match.scores?.X}`.
- Problem: Scoreboard displayed each player's score under the wrong mark.
- Fix: Mapped `XScore` to `scores.X` and `OScore` to `scores.O`.

### 9. Online final winner label was reversed

- File: `frontend/src/features/game/components/OnlineGame.jsx`
- Broken code: current user match used the opponent label.
- Problem: Winning user saw `OPP`, losing user saw `YOU`.
- Fix: Changed the comparison so matching current user displays `YOU`, otherwise `OPP`.

### 10. Backend package scripts pointed to the wrong path

- File: `backend/src/package.json`
- Broken code: `node src/server.js`
- Problem: Since `package.json` is already inside `backend/src`, start tried to load `backend/src/src/server.js` and failed with `MODULE_NOT_FOUND`.
- Fix: Changed `main` to `server.js`, `start` to `node server.js`, and `dev` to `node --watch server.js`.

### 11. JWT verification used the wrong env key

- File: `backend/src/utils/jwt.js`
- Broken code: `env.JWT_ACCES_SECRET`
- Problem: Tokens were signed with `JWT_ACCESS_SECRET` but verified with misspelled `JWT_ACCES_SECRET`, making valid tokens fail on protected routes and sockets.
- Fix: Changed verification to `env.JWT_ACCESS_SECRET`.

### 12. Signup username existence check was inverted

- File: `backend/src/services/auth.service.js`
- Broken code: threw conflict when the username did not exist.
- Problem: New users could not sign up, while existing usernames could pass the duplicate check.
- Fix: Changed the condition to throw only when `exists` is truthy.

### 13. Login password validation was inverted

- File: `backend/src/services/auth.service.js`
- Broken code: threw unauthorized when `isPasswordValid` was true.
- Problem: Correct passwords were rejected and incorrect passwords could proceed.
- Fix: Changed the condition to throw only when `!isPasswordValid`.

### 14. Friends API always returned users as offline and omitted activity

- Files:
  - `backend/src/services/friendship.service.js`
  - `backend/src/repositories/friendship.repository.js`
- Broken code: computed `isOnline` but returned `online: false`; repository did not populate `activity`.
- Problem: Friends list could not show real online state or `playing` activity.
- Fix: Returned the computed boolean online value and populated `activity` for requester/receiver.

### 15. Game invite always failed as offline

- File: `backend/src/services/gameInvite.service.js`
- Broken code: unconditional `throw new ApiError(... 'Player is offline ...')`.
- Problem: Inviting any player always failed, even when the receiver was online.
- Fix: Wrapped the throw in `if (!isReceiverOnline)`.

### 16. Duplicate pending game invites were allowed

- File: `backend/src/services/gameInvite.service.js`
- Broken code: repository had `findPendingInvite` but invite flow did not use it.
- Problem: Same sender could create repeated pending invites to the same receiver.
- Fix: Checked for an existing pending invite before creating a new one.

### 17. Accepting game invites looked for the wrong status

- File: `backend/src/services/gameInvite.service.js`
- Broken code: accepted response required `invite.status !== 'accepted'`.
- Problem: New invites are created as `pending`, so accepting them always failed as not active.
- Fix: Changed the valid response status check to `pending`.

### 18. Backend online game allowed invalid/out-of-turn moves and did not toggle turns

- File: `backend/src/services/game/GameManager.js`
- Broken code: `isPlayerX` and `isPlayerO` were calculated but not used; non-winning moves did not update `isXTurn`.
- Problem: A player could move out of turn, and after a valid non-winning move the turn stayed on the same player.
- Fix: Added player membership and turn checks, added invalid cell index guard, and toggled `isXTurn` after non-winning moves.

### 19. Backend online scoring always awarded X

- File: `backend/src/services/game/GameManager.js`
- Broken code: every non-draw win used `game.scores.X += 1`.
- Problem: O wins were counted as X wins.
- Fix: Changed scoring to `game.scores[winResult.winner] += 1`.

### 20. Backend round reset kept the old win line

- File: `backend/src/services/game/GameManager.js`
- Broken code: reset cleared board and round winner but left `winCombo`.
- Problem: After a new round started, the previous winning line could still be sent to the client.
- Fix: Added `game.winCombo = null` during round reset.

### 21. Friend request notification bell was non-functional

- File: `frontend/src/features/game/components/GameHeader.jsx`
- Broken code: Bell button had no click handler, and pending friend requests were fetched only after opening the Friends panel.
- Problem: Incoming friend requests existed in the backend and Friends panel, but the notification icon did not show/open anything and could stay stale while the panel was closed.
- Fix: Added background polling for friends/pending request data, showed a pending count badge on the Bell icon, wired Bell click to toggle the Friends/Pending panel, and included the Bell button in outside-click handling so the panel toggle is stable.

## Verification

- Frontend dependency install completed with `npm install`.
- Backend dependency install completed with `npm install`.
- `npm run build` in `frontend` completed successfully.
- `node --check backend/src/server.js` completed successfully.
- `node --check backend/src/services/game/GameManager.js` completed successfully.
- JWT sign/verify runtime sanity check completed successfully.
- GameManager turn-order runtime sanity check completed successfully.
- Full backend syntax check completed successfully:
  - `find backend/src -path '*/node_modules' -prune -o -name '*.js' -exec node --check {} \;`
- Confirmed backend package metadata now points to:
  - `main: server.js`
  - `start: node server.js`
  - `dev: node --watch server.js`
- Searched for old broken literals after fixes:
  - `JWT_ACCES_SECRET`
  - `removeItem('token')`
  - `navigate('/auth/signup')`
  - `online: false`
  - `status !== 'accepted'`
  - wrong optimistic `O/X` expression
  - No stale matches remained.

## Notes

- I did not run the backend server end-to-end because it requires a running MongoDB instance and environment variables from `backend/src/.env.example`.
- I did not run `npm audit fix --force` for the backend moderate advisory because that would change dependency versions beyond the requested bug-fix scope.
