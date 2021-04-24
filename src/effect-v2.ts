import { Firebot, Trigger } from 'firebot-custom-scripts-types';

export function buildGamblingEffect() {
    const gamblingEffect: Firebot.EffectType<{ message: string }> = {
        definition: {
            categories: ['fun', 'chat based'],
            description: 'Test',
            icon: 'fad fa-dice',
            id: 'pirak:gambling',
            name: 'Custom Gambling',
        },

        onTriggerEvent(event: { effect: { message: string }; trigger: Trigger }): Promise<boolean> {
            return Promise.resolve(false);
        },

        optionsTemplate: `
            <eos-container header="Text">
              <textarea ng-model="effect.message" class="form-control" name="message" placeholder="message…" replace-variables></textarea>
            </eos-container>
        `,

        optionsValidator(effect: { message: string }): string[] {
            return [];
        },
    };

    return gamblingEffect;
}
