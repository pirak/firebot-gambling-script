import customScript from '../src/main';

test('index default export is the custom script', () => {
    expect(customScript).not.toBeUndefined();
    expect(customScript.run).not.toBeUndefined();
    expect(customScript.getScriptManifest).not.toBeUndefined();
    expect(customScript.getScriptManifest()).not.toBeUndefined();
    expect(customScript.getDefaultParameters).not.toBeUndefined();
    expect(customScript.getDefaultParameters()).not.toBeUndefined();
});
