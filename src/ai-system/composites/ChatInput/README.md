# ChatInput

Canonical Iris message composer. Import `ChatInput` and `ChatInputProps` from `@ai`.

## Optional voice entry

```tsx
<ChatInput
  value={text}
  onChange={setText}
  onSend={sendMessage}
  onVoiceCall={startVoiceCall}
/>
```

- With `onVoiceCall`, an empty or whitespace-only value shows the stock Ink `audio-wave` action labeled **Start voice call** at the composer's trailing edge.
- Text keeps the existing Send action. Streaming keeps Stop. Loading or `disabled` disables voice entry.
- The action only invokes its callback after a click or keyboard activation. The host owns permissions, transport, call state, cancellation, and retry UI.
- Omit `onVoiceCall` to keep the original text-only behavior, including disabled Send when empty. It does not change Enter-to-send behavior: Enter in an empty textbox never initiates a call.
- `IrisAgent.onVoiceCall` forwards the same callback for all canonical composer layouts. During an active call, the host uses `composerDisabled` and provides visible call controls.
