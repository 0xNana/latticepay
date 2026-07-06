import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import {
  MockERC7984,
  MockERC7984__factory,
  PayrollExecutor,
  PayrollExecutor__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const payrollFactory = (await ethers.getContractFactory("PayrollExecutor")) as PayrollExecutor__factory;
  const tokenFactory = (await ethers.getContractFactory("MockERC7984")) as MockERC7984__factory;

  const token = (await tokenFactory.deploy()) as MockERC7984;
  const payrollExecutor = (await payrollFactory.deploy(await token.getAddress())) as PayrollExecutor;

  return { payrollExecutor, token };
}

describe("PayrollExecutor", function () {
  let signers: Signers;
  let payrollExecutor: PayrollExecutor;
  let token: MockERC7984;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    ({ payrollExecutor, token } = await deployFixture());
  });

  async function validUntilInFuture(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return Number(block!.timestamp) + 3600;
  }

  async function encryptForExecutor(
    caller: HardhatEthersSigner,
    amount: bigint
  ): Promise<{ handle: string; proof: string }> {
    const input = await fhevm
      .createEncryptedInput(await payrollExecutor.getAddress(), caller.address)
      .add64(amount)
      .encrypt();
    return { handle: input.handles[0], proof: input.inputProof };
  }

  it("reverts when inputProofs length does not match payments", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-length-mismatch"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [signers.alice.address],
        [ethers.ZeroHash],
        [],
        validUntil,
        0
      ),
    ).to.be.revertedWithCustomError(payrollExecutor, "InvalidArrayLengths");
  });

  it("reverts when caller is not the source account", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-unauthorized-caller"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor
        .connect(signers.alice)
        .executePayroll(
          runId,
          await token.getAddress(),
          signers.deployer.address,
          [signers.alice.address],
          [ethers.ZeroHash],
          ["0x01"],
          validUntil,
          0
        ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "UnauthorizedSubmitter")
      .withArgs(signers.alice.address, signers.deployer.address);
  });

  it("reverts when token argument does not match configured payroll token", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-wrong-token"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor.executePayroll(
        runId,
        signers.bob.address,
        signers.deployer.address,
        [signers.alice.address],
        [ethers.ZeroHash],
        ["0x01"],
        validUntil,
        0
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "UnexpectedToken")
      .withArgs(signers.bob.address, await token.getAddress());
  });

  it("reverts when any input proof is empty", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-empty-proof"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [signers.alice.address],
        [ethers.ZeroHash],
        ["0x"],
        validUntil,
        0
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "EmptyInputProof")
      .withArgs(0);
  });

  it("reverts on nonce mismatch", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-bad-nonce"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [signers.alice.address],
        [ethers.ZeroHash],
        ["0x01"],
        validUntil,
        1
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "InvalidNonce")
      .withArgs(0, 1);
  });

  it("reverts when batch exceeds MAX_BATCH_SIZE", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-too-large"));
    const validUntil = await validUntilInFuture();
    const count = 101;
    const recipients = Array.from({ length: count }, () => signers.alice.address);
    const encryptedAmounts = Array.from({ length: count }, () => ethers.ZeroHash);
    const inputProofs = Array.from({ length: count }, () => "0x01");

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        recipients,
        encryptedAmounts,
        inputProofs,
        validUntil,
        0
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "BatchTooLarge")
      .withArgs(count, 100);
  });

  it("reverts when a recipient is zero address", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-zero-recipient"));
    const validUntil = await validUntilInFuture();

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [ethers.ZeroAddress],
        [ethers.ZeroHash],
        ["0x01"],
        validUntil,
        0
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "InvalidRecipient")
      .withArgs(0);
  });

  it("reverts when all payments fail and does not consume run or nonce", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-all-fail"));
    const validUntil = await validUntilInFuture();
    const enc = await encryptForExecutor(signers.deployer, 1n);

    await token.setShouldRevertTransfer(true);
    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [signers.alice.address],
        [enc.handle],
        [enc.proof],
        validUntil,
        0
      ),
    ).to.be.revertedWithCustomError(payrollExecutor, "NoSuccessfulPayments");

    expect(await payrollExecutor.executedRunId(runId)).to.eq(false);
    expect(await payrollExecutor.nonces(signers.deployer.address)).to.eq(0);
  });

  it("marks run executed and rejects replay", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-replay"));
    const validUntil = await validUntilInFuture();
    const enc = await encryptForExecutor(signers.deployer, 1n);

    await payrollExecutor.executePayroll(
      runId,
      await token.getAddress(),
      signers.deployer.address,
      [signers.alice.address],
      [enc.handle],
      [enc.proof],
      validUntil,
      0
    );

    const replayEnc = await encryptForExecutor(signers.deployer, 1n);
    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        [signers.bob.address],
        [replayEnc.handle],
        [replayEnc.proof],
        validUntil,
        1
      ),
    )
      .to.be.revertedWithCustomError(payrollExecutor, "RunAlreadyExecuted")
      .withArgs(runId);
  });

  it("emits payment and run events on successful execution", async function () {
    const runId = ethers.keccak256(ethers.toUtf8Bytes("run-success"));
    const validUntil = await validUntilInFuture();
    const recipients = [signers.alice.address, signers.bob.address];
    const enc1 = await encryptForExecutor(signers.deployer, 1n);
    const enc2 = await encryptForExecutor(signers.deployer, 2n);

    await expect(
      payrollExecutor.executePayroll(
        runId,
        await token.getAddress(),
        signers.deployer.address,
        recipients,
        [enc1.handle, enc2.handle],
        [enc1.proof, enc2.proof],
        validUntil,
        0
      ),
    )
      .to.emit(payrollExecutor, "PayrollPaymentProcessed")
      .withArgs(runId, 0, recipients[0], true)
      .and.to.emit(payrollExecutor, "PayrollPaymentProcessed")
      .withArgs(runId, 1, recipients[1], true)
      .and.to.emit(payrollExecutor, "PayrollRunExecuted")
      .withArgs(runId, signers.deployer.address, await token.getAddress(), recipients.length);

    expect(await payrollExecutor.executedRunId(runId)).to.eq(true);
    expect(await payrollExecutor.nonces(signers.deployer.address)).to.eq(1);
    expect(await token.transferCount()).to.eq(2);
  });
});
