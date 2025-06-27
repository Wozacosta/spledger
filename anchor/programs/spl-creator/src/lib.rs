// Anchor program (programs/splcreator/src/lib.rs)
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

declare_id!("As3mFZdA1Ed7rZ3X3S8KQXU6oERs7QqLk85tDqCWTLDU");
#[program]
mod spl_creator {
    use super::*;

    pub fn create(ctx: Context<Create>, name: String, symbol: String, uri: String) -> Result<()> {
        let data = &mut ctx.accounts.creator_data;
        let mint = &ctx.accounts.mint;

        // Mint 1 token to caller
        let cpi_accounts = MintTo {
            mint: mint.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        mint_to(cpi_ctx, 1)?;

        // Store newly created mint
        data.spls.push(mint.key());
        data.names.push(name);
        data.symbols.push(symbol);
        data.uris.push(uri);
        Ok(())
    }

    pub fn list(ctx: Context<List>) -> Result<()> {
        msg!("Mints: {:?}", ctx.accounts.creator_data.spls);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = payer
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 1024,
        seeds = [b"spl_creator", payer.key().as_ref()],
        bump
    )]
    pub creator_data: Account<'info, CreatorData>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"spl_creator", payer.key().as_ref()],
        bump
    )]
    pub creator_data: Account<'info, CreatorData>,
}

#[account]
pub struct CreatorData {
    pub spls: Vec<Pubkey>,
    pub names: Vec<String>,
    pub symbols: Vec<String>,
    pub uris: Vec<String>,
}
